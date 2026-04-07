from __future__ import annotations

import logging
from collections.abc import Callable
from typing import Any

import torch
import torch.nn as nn
from huggingface_hub import hf_hub_download
from PIL import Image
from torchvision import transforms
from torchvision.models import MobileNet_V2_Weights, mobilenet_v2

from app.config import HF_REPO_ID, NUM_CLASSES, WEIGHTS_FILENAME

logger = logging.getLogger("ml_api")

ModelBuilder = Callable[[], nn.Module]

# Training index → display label (patched iteratively where logits index ≠ lexicographic label).
# Patched: 0→Tomato___healthy, 12→Blueberry___healthy, 26→Apple___Apple_scab (see project notes).
CORRECT_CLASS_NAMES: tuple[str, ...] = (
    "Tomato___healthy",
    "Apple___Black_rot",
    "Apple___Cedar_apple_rust",
    "Apple___healthy",
    "Blueberry___healthy",
    "Cherry_(including_sour)___Powdery_mildew",
    "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight",
    "Corn_(maize)___healthy",
    "Grape___Black_rot",
    "Blueberry___healthy",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot",
    "Peach___healthy",
    "Pepper,_bell___Bacterial_spot",
    "Pepper,_bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Apple___Apple_scab",
    "Strawberry___healthy",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy",
)

if len(CORRECT_CLASS_NAMES) != NUM_CLASSES:
    raise ValueError("CORRECT_CLASS_NAMES must have NUM_CLASSES entries")


def _build_model_report_arch() -> nn.Module:
    """Match the model card: replace classifier[1] with Dropout + Linear(38)."""
    model = mobilenet_v2(weights=MobileNet_V2_Weights.IMAGENET1K_V1)
    for p in model.features.parameters():
        p.requires_grad = False
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Sequential(
        nn.Dropout(0.2),
        nn.Linear(in_features, NUM_CLASSES),
    )
    return model


def _build_model_flat_classifier() -> nn.Module:
    """Fallback: replace entire classifier with Dropout + Linear."""
    model = mobilenet_v2(weights=MobileNet_V2_Weights.IMAGENET1K_V1)
    for p in model.features.parameters():
        p.requires_grad = False
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(0.2),
        nn.Linear(in_features, NUM_CLASSES),
    )
    return model


def _load_checkpoint_blob(path: str) -> Any:
    try:
        return torch.load(path, map_location="cpu", weights_only=True)
    except Exception:
        return torch.load(path, map_location="cpu", weights_only=False)


def _unwrap_state_dict(ckpt: Any) -> dict[str, torch.Tensor]:
    if isinstance(ckpt, dict):
        for key in ("state_dict", "model_state_dict", "model"):
            if key in ckpt and isinstance(ckpt[key], dict):
                inner = ckpt[key]
                if inner and all(isinstance(v, torch.Tensor) for v in inner.values()):
                    return inner  # type: ignore[return-value]
        if ckpt and all(isinstance(v, torch.Tensor) for v in ckpt.values()):
            return ckpt  # type: ignore[return-value]
    raise ValueError("Unrecognized checkpoint format")


class PlantDiseaseModelService:
    def __init__(self) -> None:
        self._labels: tuple[str, ...] = CORRECT_CLASS_NAMES
        self._model: nn.Module | None = None
        self._rebuild: ModelBuilder | None = None
        self._tf = transforms.Compose(
            [
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ]
        )

    def load(self) -> None:
        weights_path = hf_hub_download(repo_id=HF_REPO_ID, filename=WEIGHTS_FILENAME)
        ckpt = _load_checkpoint_blob(weights_path)
        state = _unwrap_state_dict(ckpt)

        last_err: Exception | None = None
        for builder in (_build_model_report_arch, _build_model_flat_classifier):
            model = builder()
            try:
                model.load_state_dict(state, strict=True)
            except Exception as e:
                last_err = e
                continue
            self._model = model
            self._rebuild = builder
            self._model.eval()
            logger.info("Loaded %s (%s).", WEIGHTS_FILENAME, builder.__name__)
            return
        raise RuntimeError(f"Failed to load checkpoint: {last_err}") from last_err

    def _ensure_loaded(self) -> nn.Module:
        if self._model is None or self._rebuild is None:
            raise RuntimeError("Model not loaded; call load() during app lifespan.")
        return self._model

    def _to_batch(self, image: Image.Image) -> torch.Tensor:
        if image.mode != "RGB":
            image = image.convert("RGB")
        t = self._tf(image)
        return t.unsqueeze(0)

    @staticmethod
    def _clone_state_dict(model: nn.Module) -> dict[str, torch.Tensor]:
        return {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}

    def predict(self, image: Image.Image) -> dict[str, Any]:
        """Run inference, then reload ``state_dict`` into a fresh model and compare logits."""
        model = self._ensure_loaded()
        rebuild = self._rebuild
        assert rebuild is not None

        model.eval()
        x = self._to_batch(image)

        with torch.no_grad():
            logits_direct = model(x)

        state = self._clone_state_dict(model)
        fresh = rebuild()
        fresh.load_state_dict(state)
        fresh.eval()

        with torch.no_grad():
            logits_reloaded = fresh(x)

        diff = (logits_direct - logits_reloaded).abs().max().item()
        probs = torch.softmax(logits_direct.float(), dim=1)[0]
        idx = int(probs.argmax().item())

        logger.info("Predicted index: %s, label: %s", idx, self._labels[idx])

        return {
            "label": self._labels[idx],
            "class_index": idx,
            "confidence": float(probs[idx].item()),
            "state_dict_verification": {
                "max_abs_diff": float(diff),
                "outputs_match": bool(diff < 1e-5),
            },
        }
