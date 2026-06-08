const Redis = require('redis');

let redisClient = null;

const initRedis = async () => {
  if (!process.env.REDIS_URL) {
    console.log('⚠️ Redis not configured, using in-memory cache');
    return null;
  }
  
  try {
    redisClient = Redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis connection failed after 10 retries');
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });
    
    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });
    
    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
    });
    
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    return null;
  }
};

const getCache = async (key) => {
  if (!redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
};

const setCache = async (key, value, ttl = 3600) => {
  if (!redisClient) return false;
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
};

const delCache = async (key) => {
  if (!redisClient) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Redis delete error:', error);
    return false;
  }
};

const clearUserCache = async (userId) => {
  if (!redisClient) return;
  const patterns = [`user:${userId}:*`, `monitoring:${userId}:*`];
  for (const pattern of patterns) {
    const keys = await redisClient.keys(pattern);
    if (keys.length) {
      await redisClient.del(keys);
    }
  }
};

module.exports = { initRedis, getCache, setCache, delCache, clearUserCache };
