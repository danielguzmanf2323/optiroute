"""Internal domain models used by the demo routing engine."""

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class ModelDefinition:
    """A provider model and its demo-only routing metadata."""

    id: str
    provider: str
    name: str
    complexity: str
    estimated_cost: float
    reference_cost: float
    capabilities: dict[str, bool]
    demo: bool = True

    def supports(self, required_capabilities: set[str]) -> bool:
        return all(self.capabilities.get(capability, False) for capability in required_capabilities)
