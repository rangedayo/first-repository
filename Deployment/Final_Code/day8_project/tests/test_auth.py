import pytest
from fastapi import HTTPException

from app.auth import VALID_API_KEYS, verify_api_key


@pytest.mark.asyncio
async def test_verify_api_key_missing() -> None:
    with pytest.raises(HTTPException) as exc:
        await verify_api_key(None)
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_verify_api_key_invalid() -> None:
    with pytest.raises(HTTPException) as exc:
        await verify_api_key("not-a-real-key")
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_verify_api_key_success() -> None:
    user = await verify_api_key(next(iter(VALID_API_KEYS)))
    assert user in VALID_API_KEYS.values()
