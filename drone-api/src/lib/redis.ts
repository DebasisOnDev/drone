import { Redis } from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: 5,
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  },
});

redisClient.on("connect", () => console.log("Connected to Redis"));
redisClient.on("error", (error) =>
  console.error("Redis connection error:", error)
);

export const pubClient = redisClient.duplicate();
export const subClient = redisClient.duplicate();
