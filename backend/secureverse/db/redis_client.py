import redis.asyncio as aioredis
from secureverse.config import settings

_pool = aioredis.ConnectionPool.from_url(settings.redis_url, decode_responses=False)

async def get_redis():
    client = aioredis.Redis(connection_pool=_pool)
    try:   yield client
    finally: await client.aclose()