"""Provider-agnostic routing rules for the demo catalog."""

import re
from collections.abc import Iterable

from .catalog import MODEL_CATALOG
from .models import ModelDefinition
from .schemas import RouteDecision, RouteRequest


COMPLEXITY_ORDER = {"low": 0, "medium": 1, "high": 2}
MEDIUM_SIGNALS = {
    "analiza", "analyze", "documento", "document", "código", "codigo", "code",
    "error", "arquitectura", "architecture", "compara", "compare", "resume", "summarize",
}
HIGH_SIGNALS = {
    "auditoría", "auditoria", "audit", "estrategia", "strategy", "migración", "migracion",
    "migration", "seguridad", "security", "dependencias", "dependencies", "riesgos", "risks",
}


class ManualRoutingError(ValueError):
    """Raised when an explicit manual choice cannot be honored."""


class NoCompatibleModelError(ValueError):
    """Raised when no demo route can satisfy the request."""


def detect_complexity(prompt: str) -> str:
    """Estimate task complexity from prompt shape; no file content is inspected."""
    normalized = prompt.casefold()
    words = re.findall(r"\w+", normalized, flags=re.UNICODE)
    high_matches = sum(signal in normalized for signal in HIGH_SIGNALS)
    medium_matches = sum(signal in normalized for signal in MEDIUM_SIGNALS)

    if len(words) >= 90 or high_matches >= 2:
        return "high"
    if len(words) >= 30 or high_matches >= 1 or medium_matches >= 1:
        return "medium"
    return "low"


def filter_by_provider(models: Iterable[ModelDefinition], agent: str) -> list[ModelDefinition]:
    if agent == "global":
        return list(models)
    return [model for model in models if model.provider == agent]


def filter_by_capabilities(
    models: Iterable[ModelDefinition], required_capabilities: Iterable[str]
) -> list[ModelDefinition]:
    required = set(required_capabilities)
    return [model for model in models if model.supports(required)]


def select_auto_model(models: Iterable[ModelDefinition], complexity: str) -> ModelDefinition:
    minimum_complexity = COMPLEXITY_ORDER[complexity]
    sufficient = [
        model for model in models
        if COMPLEXITY_ORDER[model.complexity] >= minimum_complexity
    ]
    if not sufficient:
        raise NoCompatibleModelError(
            "No compatible model available for the requested capabilities."
        )
    return min(
        sufficient,
        key=lambda model: (model.estimated_cost, COMPLEXITY_ORDER[model.complexity], model.id),
    )


def validate_manual_model(
    models: Iterable[ModelDefinition],
    preferred_model: str,
    agent: str,
    required_capabilities: Iterable[str],
) -> ModelDefinition:
    selected = next((model for model in MODEL_CATALOG if model.id == preferred_model), None)
    if selected is None:
        raise ManualRoutingError(f"Unknown preferred model: {preferred_model}.")
    if agent != "global" and selected.provider != agent:
        raise ManualRoutingError(
            f"Model {preferred_model} is not available for agent {agent}."
        )

    allowed_ids = {model.id for model in models}
    if selected.id not in allowed_ids:
        missing = [
            capability
            for capability in required_capabilities
            if not selected.capabilities.get(capability, False)
        ]
        if missing:
            raise ManualRoutingError(
                f"Model {preferred_model} does not support required capabilities: {', '.join(missing)}."
            )
        raise ManualRoutingError(f"Model {preferred_model} is not allowed for this request.")
    return selected


def calculate_demo_costs(model: ModelDefinition) -> dict[str, float]:
    estimated_cost = round(model.estimated_cost, 6)
    reference_cost = round(model.reference_cost, 6)
    estimated_savings = round(max(reference_cost - estimated_cost, 0.0), 6)
    savings_percent = round(
        (estimated_savings / reference_cost * 100) if reference_cost else 0.0,
        2,
    )
    return {
        "estimated_cost": estimated_cost,
        "reference_cost": reference_cost,
        "estimated_savings": estimated_savings,
        "savings_percent": savings_percent,
    }


def build_reason(model: ModelDefinition, request: RouteRequest, complexity: str) -> str:
    capabilities = ", ".join(request.required_capabilities)
    if request.mode == "manual":
        return (
            f"Demo manual route validated: {model.name} belongs to the allowed provider "
            f"scope and supports {capabilities}."
        )
    scope = "all demo providers" if request.agent == "global" else f"the {request.agent} demo catalog"
    return (
        f"Demo auto route selected the lowest-cost compatible model of {complexity} "
        f"complexity or higher within {scope}; required capabilities: {capabilities}."
    )


def route_request(request: RouteRequest) -> RouteDecision:
    complexity = detect_complexity(request.prompt)
    provider_models = filter_by_provider(MODEL_CATALOG, request.agent)
    compatible_models = filter_by_capabilities(
        provider_models, request.required_capabilities
    )

    if not compatible_models:
        raise NoCompatibleModelError(
            "No compatible model available for the requested capabilities."
        )

    if request.mode == "manual":
        model = validate_manual_model(
            compatible_models,
            request.preferred_model or "",
            request.agent,
            request.required_capabilities,
        )
    else:
        model = select_auto_model(compatible_models, complexity)

    return RouteDecision(
        provider=model.provider,
        model=model.id,
        complexity=complexity,
        input_type=request.input_type,
        required_capabilities=request.required_capabilities,
        **calculate_demo_costs(model),
        reason=build_reason(model, request, complexity),
        verified=True,
        demo=True,
    )
