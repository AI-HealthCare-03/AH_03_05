import redis.asyncio as aioredis

from app.core.config import Config

config = Config()

redis_client = aioredis.from_url(
    f"redis://{config.REDIS_HOST}:{config.REDIS_PORT}",
    encoding="utf-8",
    decode_responses=True,
)
