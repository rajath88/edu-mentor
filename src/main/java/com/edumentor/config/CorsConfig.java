package com.edumentor.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    private static final List<String> ALLOWED_METHODS = List.of(
            "GET", "POST", "PUT", "DELETE", "OPTIONS"
    );
    private static final List<String> ALLOWED_HEADERS = List.of(
            "Content-Type", "Authorization"
    );

    private final CorsConfiguration corsConfiguration;

    public CorsConfig(@Value("${app.cors.allowed-origin-patterns}") String allowedOriginPatterns) {
        List<String> originPatterns = Arrays.stream(allowedOriginPatterns.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();

        this.corsConfiguration = new CorsConfiguration();
        this.corsConfiguration.setAllowedOriginPatterns(originPatterns);
        this.corsConfiguration.setAllowedMethods(ALLOWED_METHODS);
        this.corsConfiguration.setAllowedHeaders(ALLOWED_HEADERS);
        this.corsConfiguration.setAllowCredentials(false);
        this.corsConfiguration.setMaxAge(3600L);
    }

    public CorsConfiguration corsConfiguration() {
        return corsConfiguration;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns(corsConfiguration.getAllowedOriginPatterns().toArray(String[]::new))
                .allowedMethods(corsConfiguration.getAllowedMethods().toArray(String[]::new))
                .allowedHeaders(corsConfiguration.getAllowedHeaders().toArray(String[]::new))
                .allowCredentials(Boolean.TRUE.equals(corsConfiguration.getAllowCredentials()))
                .maxAge(corsConfiguration.getMaxAge());
    }
}
