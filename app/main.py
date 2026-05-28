from fastapi import FastAPI

from app.apis.v1 import v1_routers
from app.core.db.databases import initialize_tortoise

app = FastAPI(
    docs_url="/api/docs", redoc_url="/api/redoc", openapi_url="/api/openapi.json"
)

initialize_tortoise(app)

app.include_router(v1_routers)
