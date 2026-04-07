import io
from typing import Any

import pytest
from PIL import Image
from fastapi.testclient import TestClient

from app.auth import VALID_API_KEYS
from app.main import create_app


class _StubModelService:
    def load(self) -> None:
        return None

    def predict(self, image: Image.Image) -> dict[str, Any]:
        return {
            "label": "Tomato___healthy",
            "class_index": 31,
            "confidence": 0.9123,
            "state_dict_verification": {
                "max_abs_diff": 0.0,
                "outputs_match": True,
            },
        }


@pytest.fixture
def client() -> TestClient:
    app = create_app(lambda: _StubModelService())
    with TestClient(app) as c:
        yield c


def _png_bytes() -> bytes:
    img = Image.new("RGB", (32, 32), color="green")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_predict_success(client: TestClient) -> None:
    key = next(iter(VALID_API_KEYS))
    files = {"file": ("leaf.png", _png_bytes(), "image/png")}
    r = client.post("/predict", files=files, headers={"X-API-Key": key})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["success"] is True
    assert body["label"] == "Tomato___healthy"
    assert body["state_dict_verification"]["outputs_match"] is True


def test_predict_unauthorized(client: TestClient) -> None:
    files = {"file": ("leaf.png", _png_bytes(), "image/png")}
    r = client.post("/predict", files=files)
    assert r.status_code == 401


def test_predict_bad_image_type(client: TestClient) -> None:
    key = next(iter(VALID_API_KEYS))
    files = {"file": ("x.gif", b"GIF89a", "image/gif")}
    r = client.post("/predict", files=files, headers={"X-API-Key": key})
    assert r.status_code == 400


def test_health(client: TestClient) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
