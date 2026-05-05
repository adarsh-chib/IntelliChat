import { ConnectionOptions } from 'bullmq';

/**
 * Redis connection configuration
 * host: 127.0.0.1 (Localhost)
 * port: 6379 (Default Redis port)
 */
export const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  username: process.env.REDIS_USERNAME,
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  maxRetriesPerRequest: null,
};

export const USE_REDIS = process.env.USE_REDIS === 'true' || !!process.env.REDIS_HOST;
