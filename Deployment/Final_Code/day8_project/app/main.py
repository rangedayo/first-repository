from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Any, Callable

from fastapi import Depends, FastAPI, File, Request, UploadFile

from app.auth import verify_api_key
from app.error_handlers import register_error_handlers
from app.image_utils import validate_and_read_image
from app.logger_config import setup_logger
from app.middleware import RequestLoggingMiddleware
from app.config import HF_REPO_ID
from app.schemas import HealthResponse, PredictResponse

setup_logger()
logger = logging.getLogger("ml_api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting model load from Hugging Face Hub...")
    factory: Callable[[], Any] = app.state.model_service_factory
    service = factory()
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, service.load)
    app.state.model_service = service
    logger.info("Model ready.")
    yield


def create_app(
    model_service_factory: Callable[[], Any] | None = None,
) -> FastAPI:
    if model_service_factory is None:
        from app.model_service import PlantDiseaseModelService

        factory: Callable[[], Any] = PlantDiseaseModelService
    else:
        factory = model_service_factory
    app = FastAPI(
        title="Plant disease inference",
        version="1.0.0",
        lifespan=lifespan,
    )
    app.state.model_service_factory = factory
    register_error_handlers(app)
    app.add_middleware(RequestLoggingMiddleware)

    @app.get("/health", response_model=HealthResponse)
    async def health() -> HealthResponse:
        return HealthResponse(status="ok", model_repo=HF_REPO_ID)

    @app.post("/predict", response_model=PredictResponse)
    async def predict(
        request: Request,
        _: str = Depends(verify_api_key),
        file: UploadFile = File(..., description="Leaf image (JPEG/PNG, max 5MB)."),
    ) -> PredictResponse:
        image = await validate_and_read_image(file)
        service: Any = request.app.state.model_service
        loop = asyncio.get_running_loop()
        payload = await loop.run_in_executor(None, service.predict, image)
        return PredictResponse.model_validate(payload)

    return app


_default_app: FastAPI | None = None


def __getattr__(name: str) -> FastAPI:
    global _default_app
    if name == "app":
        if _default_app is None:
            _default_app = create_app()
        return _default_app
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
