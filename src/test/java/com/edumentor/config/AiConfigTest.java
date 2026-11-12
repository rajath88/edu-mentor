package com.edumentor.config;

import dev.langchain4j.model.openai.OpenAiChatModel;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;

class AiConfigTest {

    @Test
    void configuresMaximumCompletionTokensForOpenAiCompatibleGroqModel() {
        AiConfig config = new AiConfig();

        OpenAiChatModel model = assertInstanceOf(
                OpenAiChatModel.class,
                config.chatModel(
                        "test-api-key",
                        "openai/gpt-oss-120b",
                        "https://api.groq.com/openai/v1/"
                )
        );

        assertEquals(1024, model.defaultRequestParameters().maxCompletionTokens());
    }
}
