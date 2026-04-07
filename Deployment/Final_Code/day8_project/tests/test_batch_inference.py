import io
from typing import Any

import pytest
from PIL import Image
from fastapi.testclient import TestClient

from app.auth import VALID_API_KEYS
from app.main import create_app


class _CounterService:
    def __init__(self) -> None:
        self._n = 0

    def load(self) -> None:
        return None

    def predict(self, image: Image.Image) -> dict[str, Any]:
        self._n += 1
        return {
            "label": f"class_{self._n}",
            "class_index": min(self._n - 1, 37),
            "confidence": 0.5,
            "state_dict_verification": {"max_abs_diff": 0.0, "outputs_match": True},
        }


@pytest.fixture
def client() -> TestClient:
    app = create_app(lambda: _CounterService())
    with TestClient(app) as c:
        yield c


def _png(name: str, color: tuple[int, int, int]) -> tuple[str, bytes, str]:
    img = Image.new("RGB", (24, 24), color=color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return (f"{name}.png", buf.getvalue(), "image/png")


def test_batch_sequential_requests(client: TestClient) -> None:
    key = next(iter(VALID_API_KEYS))
    headers = {"X-API-Key": key}
    payloads = [_png("a", (255, 0, 0)), _png("b", (0, 255, 0)), _png("c", (0, 0, 255))]
    results: list[dict] = []
    for filename, data, mime in payloads:
        r = client.post("/predict", files={"file": (filename, data, mime)}, headers=headers)
        assert r.status_code == 200, r.text
        results.append(r.json())
    assert results[0]["label"] == "class_1"
    assert results[1]["label"] == "class_2"
    assert results[2]["label"] == "class_3"
