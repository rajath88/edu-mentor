package com.edumentor.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ValkeyHostEnvironmentPostProcessorTest {

    @Test
    void stripsPortFromRedisHostAndLeavesSeparatePortUnchanged() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("spring.data.redis.host", "red-dbl3f8ei0phs73bn0kj0:6379")
                .withProperty("spring.data.redis.port", "6379");

        new ValkeyHostEnvironmentPostProcessor().postProcessEnvironment(environment, new SpringApplication());

        assertEquals("red-dbl3f8ei0phs73bn0kj0", environment.getProperty("spring.data.redis.host"));
        assertEquals("6379", environment.getProperty("spring.data.redis.port"));
    }

    @Test
    void preservesHostOnlyValueUsedByDockerCompose() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("spring.data.redis.host", "valkey")
                .withProperty("spring.data.redis.port", "6379");

        new ValkeyHostEnvironmentPostProcessor().postProcessEnvironment(environment, new SpringApplication());

        assertEquals("valkey", environment.getProperty("spring.data.redis.host"));
        assertEquals("6379", environment.getProperty("spring.data.redis.port"));
    }
}
