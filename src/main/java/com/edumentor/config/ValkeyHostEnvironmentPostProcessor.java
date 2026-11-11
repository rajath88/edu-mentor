package com.edumentor.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Normalizes Render-style host:port values before Spring binds Redis properties. */
public final class ValkeyHostEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final Pattern DNS_HOST_WITH_PORT = Pattern.compile("^([A-Za-z0-9.-]+):([0-9]{1,5})$");
    private static final String NORMALIZED_HOST_PROPERTY_SOURCE = "normalizedValkeyHost";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String configuredHost = environment.getProperty("spring.data.redis.host");
        if (configuredHost == null) {
            return;
        }

        Matcher matcher = DNS_HOST_WITH_PORT.matcher(configuredHost.trim());
        if (matcher.matches()) {
            environment.getPropertySources().addFirst(new MapPropertySource(
                    NORMALIZED_HOST_PROPERTY_SOURCE,
                    Map.of("spring.data.redis.host", matcher.group(1))
            ));
        }
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }
}
