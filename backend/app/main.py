"""FastAPI entry point for OptiRoute's standalone routing service."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import __version__
from .config import settings
from .routing import ManualRoutingError, NoCompatibleModelError, route_request
from .schemas import HealthResponse, RouteDecision, RouteRequest


app = FastAPI(title="OptiRoute API", version=__version__)
app.state.environment = settings.environment

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="optiroute-api", version=__version__)


@app.post("/route", response_model=RouteDecision)
def route(payload: RouteRequest) -> RouteDecision:
    try:
        return route_request(payload)
    except ManualRoutingError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except NoCompatibleModelError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
