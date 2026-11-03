# Container for Google Cloud Run: the API, and the same image runs the daily jobs.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Dependencies first, so code-only changes rebuild fast.
COPY pyproject.toml ./
COPY app ./app
COPY scripts ./scripts
RUN pip install .

COPY alembic.ini ./
COPY alembic ./alembic

# Cloud Run sends traffic to $PORT (8080 by default). exec makes uvicorn PID 1,
# so it receives the shutdown signal and closes cleanly when the instance scales down.
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}
