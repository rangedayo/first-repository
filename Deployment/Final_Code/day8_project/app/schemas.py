from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class StateDictVerification(BaseModel):
    """Compares logits before vs after reloading ``state_dict`` into a fresh model."""

    max_abs_diff: float = Field(ge=0, description="Max |logit_diff| across tensor.")
    outputs_match: bool = Field(description="True if reload produced (near) identical logits.")


class PredictResponse(BaseModel):
    success: bool = True
    label: str = Field(min_length=1, max_length=512)
    class_index: int = Field(ge=0, lt=38)
    confidence: float = Field(ge=0.0, le=1.0)
    state_dict_verification: StateDictVerification

    @field_validator("confidence")
    @classmethod
    def float_reasonable(cls, v: float) -> float:
        if v != v:  # NaN
            raise ValueError("confidence must be a number")
        return v


class HealthResponse(BaseModel):
    status: str = "ok"
    model_repo: str
