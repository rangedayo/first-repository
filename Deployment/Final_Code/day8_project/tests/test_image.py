import io

import pytest
from fastapi import HTTPException
from PIL import Image
from starlette.datastructures import Headers, UploadFile

from app.image_utils import MAX_FILE_SIZE, validate_and_read_image


def _png_bytes() -> bytes:
    img = Image.new("RGB", (48, 48), color=(10, 140, 80))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.mark.asyncio
async def test_validate_and_read_accepts_png() -> None:
    data = _png_bytes()
    up = UploadFile(
        io.BytesIO(data),
        filename="leaf.png",
        headers=Headers({"content-type": "image/png"}),
    )
    out = await validate_and_read_image(up)
    assert out.size == (224, 224)
    assert out.mode == "RGB"


@pytest.mark.asyncio
async def test_validate_and_read_rejects_mime() -> None:
    up = UploadFile(
        io.BytesIO(b"not an image"),
        filename="x.gif",
        headers=Headers({"content-type": "image/gif"}),
    )
    with pytest.raises(HTTPException) as exc:
        await validate_and_read_image(up)
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_validate_and_read_rejects_size() -> None:
    up = UploadFile(
        io.BytesIO(b"x" * (MAX_FILE_SIZE + 1)),
        filename="big.png",
        headers=Headers({"content-type": "image/png"}),
    )
    with pytest.raises(HTTPException) as exc:
        await validate_and_read_image(up)
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_validate_and_read_rejects_corrupt() -> None:
    up = UploadFile(
        io.BytesIO(b"not a real png"),
        filename="bad.png",
        headers=Headers({"content-type": "image/png"}),
    )
    with pytest.raises(HTTPException) as exc:
        await validate_and_read_image(up)
    assert exc.value.status_code == 400
