"""Pydantic request and response contracts for OptiRoute API."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


Agent = Literal["global", "openai", "google", "anthropic", "deepseek", "kimi"]
RoutingMode = Literal["auto", "manual"]
InputType = Literal["text", "image", "document", "multimodal"]
Capability = Literal["text", "vision", "documents"]

EXPECTED_CAPABILITIES: dict[str, set[str]] = {
    "text": {"text"},
    "image": {"text", "vision"},
    "document": {"text", "documents"},
    "multimodal": {"text", "vision", "documents"},
}


class RouteRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    agent: Agent
    mode: RoutingMode
    prompt: str = Field(min_length=1, max_length=50_000)
    input_type: InputType
    required_capabilities: list[Capability] = Field(min_length=1)
    preferred_model: str | None = None

    @field_validator("agent", "mode", "input_type", mode="before")
    @classmethod
    def normalize_keyword(cls, value: object) -> object:
        return value.strip().lower() if isinstance(value, str) else value

    @field_validator("prompt")
    @classmethod
    def validate_prompt(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("prompt must not be blank")
        return value.strip()

    @field_validator("required_capabilities", mode="before")
    @classmethod
    def normalize_capabilities(cls, value: object) -> object:
        if not isinstance(value, list):
            return value
        return list(dict.fromkeys(item.strip().lower() if isinstance(item, str) else item for item in value))

    @field_validator("preferred_model")
    @classmethod
    def validate_preferred_model(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            raise ValueError("preferred_model must be a non-empty model id")
        return normalized

    @model_validator(mode="after")
    def validate_request_consistency(self) -> "RouteRequest":
        expected = EXPECTED_CAPABILITIES[self.input_type]
        received = set(self.required_capabilities)
        if received != expected:
            expected_list = ", ".join(sorted(expected))
            raise ValueError(
                f"required_capabilities must match input_type '{self.input_type}': {expected_list}"
            )
        if self.mode == "manual" and self.preferred_model is None:
            raise ValueError("preferred_model is required when mode is 'manual'")
        if self.mode == "auto" and self.preferred_model is not None:
            raise ValueError("preferred_model must be null when mode is 'auto'")
        return self


class RouteDecision(BaseModel):
    provider: str
    model: str
    complexity: Literal["low", "medium", "high"]
    input_type: InputType
    required_capabilities: list[Capability]
    estimated_cost: float
    reference_cost: float
    estimated_savings: float
    savings_percent: float
    reason: str
    verified: bool
    demo: bool


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: Literal["optiroute-api"]
    version: Literal["0.1.0"]
