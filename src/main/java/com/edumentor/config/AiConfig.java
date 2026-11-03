
package com.edumentor.config;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.ollama.OllamaChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class AiConfig {

    @Bean
    ChatModel chatModel() {
        return OllamaChatModel.builder()
                .baseUrl("http://host.docker.internal:11434")
                .modelName("llama3.2")
                .temperature(0.4)
                .timeout(Duration.ofSeconds(60))
                .build();
    }
}
