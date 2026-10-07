"""Demo model catalog.

Costs and capabilities in this module are product-demo metadata. They are not
live provider prices or guarantees about production APIs.
"""

from .models import ModelDefinition


def _capabilities(*enabled: str) -> dict[str, bool]:
    return {
        "text": "text" in enabled,
        "vision": "vision" in enabled,
        "documents": "documents" in enabled,
    }


MODEL_CATALOG: tuple[ModelDefinition, ...] = (
    ModelDefinition("gpt-5.6-luna-demo", "openai", "GPT 5.6 Luna (Demo)", "low", 0.0002, 0.0032, _capabilities("text")),
    ModelDefinition("gpt-5.6-sol-demo", "openai", "GPT 5.6 Sol (Demo)", "medium", 0.0060, 0.0120, _capabilities("text", "vision", "documents")),
    ModelDefinition("gpt-5.6-sol-max-demo", "openai", "GPT 5.6 Sol Max (Demo)", "high", 0.0160, 0.0300, _capabilities("text", "vision", "documents")),
    ModelDefinition("gemini-flash-lite-demo", "google", "Gemini Flash Lite (Demo)", "low", 0.0004, 0.0040, _capabilities("text", "vision")),
    ModelDefinition("gemini-2.5-flash-demo", "google", "Gemini 2.5 Flash (Demo)", "medium", 0.0040, 0.0140, _capabilities("text", "vision", "documents")),
    ModelDefinition("gemini-2.5-pro-demo", "google", "Gemini 2.5 Pro (Demo)", "high", 0.0120, 0.0320, _capabilities("text", "vision", "documents")),
    ModelDefinition("claude-haiku-eco-demo", "anthropic", "Claude Haiku Eco (Demo)", "low", 0.0006, 0.0042, _capabilities("text")),
    ModelDefinition("claude-haiku-4.5-demo", "anthropic", "Claude Haiku 4.5 (Demo)", "medium", 0.0030, 0.0120, _capabilities("text", "documents")),
    ModelDefinition("claude-sonnet-route-demo", "anthropic", "Claude Sonnet Route (Demo)", "high", 0.0140, 0.0310, _capabilities("text", "vision", "documents")),
    ModelDefinition("deepseek-route-lite-demo", "deepseek", "DeepSeek Route Lite (Demo)", "low", 0.0001, 0.0015, _capabilities("text")),
    ModelDefinition("deepseek-route-core-demo", "deepseek", "DeepSeek Route Core (Demo)", "medium", 0.0015, 0.0050, _capabilities("text", "documents")),
    ModelDefinition("deepseek-route-pro-demo", "deepseek", "DeepSeek Route Pro (Demo)", "high", 0.0055, 0.0160, _capabilities("text", "documents")),
    ModelDefinition("kimi-route-lite-demo", "kimi", "Kimi Route Lite (Demo)", "low", 0.0002, 0.0020, _capabilities("text")),
    ModelDefinition("kimi-route-core-demo", "kimi", "Kimi Route Core (Demo)", "medium", 0.0022, 0.0070, _capabilities("text", "documents")),
    ModelDefinition("kimi-route-pro-demo", "kimi", "Kimi Route Pro (Demo)", "high", 0.0075, 0.0200, _capabilities("text", "vision", "documents")),
)

SUPPORTED_PROVIDERS = frozenset(model.provider for model in MODEL_CATALOG)
