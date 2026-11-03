from collections.abc import Iterator

from sqlalchemy import Connection, create_engine

from app.core.config import get_settings

engine = create_engine(get_settings().database_url, pool_pre_ping=True)


def get_conn() -> Iterator[Connection]:
    """FastAPI dependency: one transaction per request."""
    with engine.begin() as conn:
        yield conn
