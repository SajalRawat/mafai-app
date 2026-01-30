import Redis from 'ioredis';
import { logger } from './logger';

const REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379';

const getRedisClient = () => {
    logger.info(`Initializing Redis client with URI: ${REDIS_URI}`);
    const client = new Redis(REDIS_URI, {
        lazyConnect: true
    });

    client.on('error', (err) => {
        logger.error('Redis Client Error', err);
    });

    client.on('connect', () => {
        logger.info('Redis Client Connected');
    });

    return client;
};

// Use global singleton for Redis in development similar to Mongoose
const globalForRedis = global as unknown as { redis: Redis };

export const redis = globalForRedis.redis || getRedisClient();

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;
