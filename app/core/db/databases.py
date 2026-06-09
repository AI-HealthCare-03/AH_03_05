from fastapi import FastAPI
from tortoise import Tortoise
from tortoise.contrib.fastapi import register_tortoise

from app.core import config

TORTOISE_APP_MODELS = [
    "aerich.models",
    "app.models.users",
    "app.models.auth_tokens",
    "app.models.user_consents",
    "app.models.user_health_profiles",
    "app.models.medical_records",
    "app.models.ocr_lines",
    "app.models.processing_jobs",
    "app.models.medications",
    "app.models.notifications",
    "app.models.notification_settings",
    "app.models.feedbacks",
    "app.models.drug_references",
    "app.models.api_failure_logs",
    "app.models.chat_sessions",
    "app.models.chat_messages",
    "app.models.guides",
    "app.models.guideline_sources",
    "app.models.guideline_chunks",
    "app.models.prompt_policies",
]

TORTOISE_ORM = {
    "connections": {
        "default": {
            "engine": "tortoise.backends.asyncpg",
            "dialect": "asyncpg",
            "credentials": {
                "host": config.DB_HOST,
                "port": config.DB_PORT,
                "user": config.DB_USER,
                "password": config.DB_PASSWORD,
                "database": config.DB_NAME,
                "command_timeout": config.DB_CONNECT_TIMEOUT,
                "maxsize": config.DB_CONNECTION_POOL_MAXSIZE,
            },
        },
    },
    "apps": {
        "models": {
            "models": TORTOISE_APP_MODELS,
        },
    },
    "timezone": "Asia/Seoul",
}


def initialize_tortoise(app: FastAPI) -> None:
    Tortoise.init_models(TORTOISE_APP_MODELS, "models")
    register_tortoise(app, config=TORTOISE_ORM)
