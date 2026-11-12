package com.edumentor.agent;

import com.edumentor.service.AnalyticsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.langchain4j.exception.HttpException;
import dev.langchain4j.model.chat.ChatModel;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MentorAgentTest {

    @Test
    void answersWithOneModelCallAndIncludesStudentAnalytics() throws Exception {
        ChatModel model = mock(ChatModel.class);
        AnalyticsService analytics = mock(AnalyticsService.class);
        when(analytics.compute(42L)).thenReturn(new AnalyticsService.Analytics(
                42L,
                List.of(new AnalyticsService.SubjectStats("Math", 82.5, 4.0, "Algebra", 12L)),
                3,
                82.5,
                List.of()
        ));
        when(model.chat(anyString())).thenReturn("## Binary search\n\nIt halves the search range.");
        MentorAgent agent = new MentorAgent(model, analytics, new ObjectMapper(), "test-key");

        String answer = agent.run(42L, "Explain binary search");

        assertEquals("## Binary search\n\nIt halves the search range.", answer);
        var prompt = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(model, times(1)).chat(prompt.capture());
        assertTrue(prompt.getValue().contains("\"subject\":\"Math\""));
        assertTrue(prompt.getValue().contains("Explain binary search"));
        assertTrue(prompt.getValue().contains("silently check"));
        verify(analytics, times(1)).compute(42L);
    }

    @Test
    void returnsFriendlyRateLimitMessageWithoutRetryingTheModelCall() throws Exception {
        ChatModel model = mock(ChatModel.class);
        AnalyticsService analytics = mock(AnalyticsService.class);
        when(analytics.compute(42L)).thenReturn(new AnalyticsService.Analytics(
                42L, List.of(), 0, 0.0, List.of()
        ));
        when(model.chat(anyString())).thenThrow(new HttpException(429, "rate limit exceeded"));
        MentorAgent agent = new MentorAgent(model, analytics, new ObjectMapper(), "test-key");

        MentorRequestException failure = assertThrows(
                MentorRequestException.class,
                () -> agent.run(42L, "Explain binary search")
        );

        assertTrue(failure.getMessage().contains("rate-limited"));
        verify(model, times(1)).chat(anyString());
    }
}
