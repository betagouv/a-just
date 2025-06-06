import { createClient } from "redis";
import config from "config";

let client = null;
let superCache = {};

if (config.redis) {
  const loadRedis = async () => {
    client = await createClient({
      url: config.redis,
    })
      .on("error", (err) => console.log("Redis Client Error", err))
      .connect();
  };
  loadRedis();
}

export const getCacheValue = async (key, cacheName) => {
  if (client === null) {
    try {
      return superCache[cacheName][key];
    } catch (e) {
      return null;
    }
  }

  const value = await client.get(cacheName + key + "");
  if (value) {
    return JSON.parse(value);
  }

  return null;
};

export const setCacheValue = async (key, value, cacheName) => {
  if (client === null) {
    if (!superCache[cacheName]) {
      superCache[cacheName] = {};
    }
    superCache[cacheName][key + ""] = value;
    return;
  }

  await client.set(cacheName + key + "", JSON.stringify(value));
};

export const deleteCacheValue = async (key, cacheName) => {
  if (client === null) {
    if (superCache[cacheName] && key) {
      delete superCache[cacheName][key];
    } else if (superCache[cacheName]) {
      superCache[cacheName] = {};
    }
    return;
  }

  await client.set(cacheName + key + "", "");
};
