"""Async Redis connection pool and dependency."""
import redis.asyncio as aioredis

from secureverse.config import settings

_pool = aioredis.ConnectionPool.from_url(settings.redis_url, decode_responses=False)


async def get_redis():
    """Yield an async Redis client and close it when the request ends."""
    client = aioredis.Redis(connection_pool=_pool)
    try:
        yield client
    finally:
        await client.aclose()
