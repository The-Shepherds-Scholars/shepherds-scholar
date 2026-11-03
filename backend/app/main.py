from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import readings, scripture

app = FastAPI(title="The Shepherd’s Scholar API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)

app.include_router(scripture.router)
app.include_router(readings.router)


@app.get("/api/v1/health")
def health():
    return {"status": "ok", "service": "shepherds-scholar"}
