package com.pipeline.image.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.connection.RedisStringCommands;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.types.Expiration;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RedisService {
    private final RedisTemplate<String, Object> redisTemplate;

    public void saveWithTTL(String key, String value, long ttl, TimeUnit timeUnit) {
        this.redisTemplate.opsForValue().set(key, value, ttl, timeUnit);
    }

    public boolean hasKey(String key) {
        return this.redisTemplate.hasKey(key);
    }

    public String getValue(String key) {
        Object value = this.redisTemplate.opsForValue().get(key);
        return value != null ? value.toString() : null;
    }

    public void deleteKey(String key) {
        this.redisTemplate.delete(key);
    }

    public void replaceKey(String oldKey, String newKey, String value, long ttl, TimeUnit timeUnit) {
        this.redisTemplate.delete(oldKey);
        this.redisTemplate.opsForValue().set(newKey, value, ttl, timeUnit);
    }

    public void updateValue(String key, String value) {
        this.redisTemplate.execute((RedisCallback<Void>) connection -> {
            connection.stringCommands().set(
                    key.getBytes(),
                    value.getBytes(),
                    Expiration.keepTtl(),
                    RedisStringCommands.SetOption.upsert()
            );
            return null;
        });
    }

    public void deleteByPattern(String pattern) {
        Set<String> keys = this.redisTemplate.keys(pattern);
        if (!keys.isEmpty()) {
            this.redisTemplate.delete(keys);
        }
    }
}
