import { config } from '../config/configuration';
import IORedis from 'ioredis';

// Redis connection with required option
export const redisConnection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

redisConnection.on('error', (err) => console.error('Redis error:', err));

async function getCached<T>(key: string): Promise<T | null> {
  const raw = await redisConnection.get(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

async function setCached<T>(key: string, value: T, ttlInSeconds: number): Promise<void> {
  await redisConnection.setex(key, ttlInSeconds, JSON.stringify(value));
}

export { getCached, setCached };