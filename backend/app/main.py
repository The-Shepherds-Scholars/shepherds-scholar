from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.core.config import get_settings
from app.routers import places, readings, scripture

app = FastAPI(title="The Shepherd’s Scholar API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)

# Compress larger responses, such as the full list of 1,300+ places for the map.
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.include_router(scripture.router)
app.include_router(readings.router)
app.include_router(places.router)


@app.get("/api/v1/health")
def health():
    return {"status": "ok", "service": "shepherds-scholar"}
