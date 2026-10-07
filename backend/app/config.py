"""Environment configuration for the OptiRoute API."""

import os
from dataclasses import dataclass

from dotenv import load_dotenv


load_dotenv()

FUTURE_PROVIDER_KEY_NAMES = (
    "OPENAI_API_KEY",
    "GOOGLE_API_KEY",
    "ANTHROPIC_API_KEY",
    "DEEPSEEK_API_KEY",
    "KIMI_API_KEY",
)


@dataclass(frozen=True, slots=True)
class Settings:
    environment: str = "development"


def get_settings() -> Settings:
    return Settings(environment=os.getenv("OPTIRoute_ENV", "development"))


settings = get_settings()
