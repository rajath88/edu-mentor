
package com.edumentor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableCaching
@EnableJpaRepositories(
    basePackages = "com.edumentor.domain",
    considerNestedRepositories = true
)
public class EduMentorApplication {
    public static void main(String[] args) {
        SpringApplication.run(EduMentorApplication.class, args);
    }
}
                                      