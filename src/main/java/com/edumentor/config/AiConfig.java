
package com.edumentor.config;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import org.springframework.core.env.Environment;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class AiConfig {

    @Bean
    ChatModel chatModel(Environment env) {
        String apiKey = env.getProperty("GEMINI_API_KEY");

        return OpenAiChatModel.builder()
                .baseUrl("https://generativelanguage.googleapis.com/v1beta/openai/")
                .apiKey(apiKey)
                .modelName("gemini-2.5-flash")
                .temperature(0.4)
                .timeout(Duration.ofSeconds(60))
                .build();
    }
}
