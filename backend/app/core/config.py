from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All settings come from environment variables or backend/.env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/shepherds_scholar"
    # Neon connection string as Neon gives it (postgresql://...). When set, it wins over database_url.
    neon_database_url: str | None = None

    @model_validator(mode="after")
    def _use_neon_when_set(self) -> "Settings":
        if self.neon_database_url:
            url = self.neon_database_url
            for prefix in ("postgresql://", "postgres://"):
                if url.startswith(prefix):
                    url = "postgresql+psycopg://" + url[len(prefix):]
            self.database_url = url
        return self

    # API.Bible: only the background job ever uses the key.
    api_bible_key: str | None = None
    api_bible_base_url: str = "https://rest.api.bible/v1"
    # Stay below the plan limit so a bad day never locks you out for the month.
    api_bible_monthly_budget: int = 4500

    # API.Bible requires cached text to be refreshed at least every 30 days.
    cache_refresh_after_days: int = 25
    cache_max_age_days: int = 30

    # Daily readings: fetch today plus this many days ahead, once per date.
    readings_days_ahead: int = 6

    cors_origins: list[str] = ["http://localhost:5173"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
