from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.apis.v1 import v1_routers
from app.core.db.databases import initialize_tortoise
from app.core.scheduler import start_scheduler, stop_scheduler
from app.exceptions.common import TooManyRequestsException


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)


@app.exception_handler(TooManyRequestsException)
async def too_many_requests_handler(request, exc: TooManyRequestsException) -> JSONResponse:
    body = exc.detail if isinstance(exc.detail, dict) else {"detail": exc.detail}
    return JSONResponse(status_code=exc.status_code, content=body)


initialize_tortoise(app)
app.include_router(v1_routers)
