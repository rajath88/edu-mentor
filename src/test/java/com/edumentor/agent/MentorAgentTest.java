package com.edumentor.agent;

import com.edumentor.domain.MentorMessage;
import com.edumentor.domain.Repos.MessageRepo;
import com.edumentor.domain.Repos.StudentRepo;
import com.edumentor.domain.Student;
import com.edumentor.service.AnalyticsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.exception.HttpException;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.response.ChatResponse;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class MentorAgentTest {

    @Test
    void sendsSystemInstructionsPriorTurnsAndCurrentQuestionAsDistinctChatRoles() throws Exception {
        ChatModel model = mock(ChatModel.class);
        AnalyticsService analytics = mock(AnalyticsService.class);
        StudentRepo students = mock(StudentRepo.class);
        MessageRepo messages = mock(MessageRepo.class);
        when(students.findById(42L)).thenReturn(Optional.of(new Student("Riya Patel", "riya@example.com")));
        when(messages.findTop10ByStudentIdOrderByCreatedAtDescIdDesc(42L)).thenReturn(List.of(
                new MentorMessage(42L, "mentor", "A queue is FIFO: first in, first out."),
                new MentorMessage(42L, "student", "Can you explain queues?")));
        when(analytics.compute(42L)).thenReturn(new AnalyticsService.Analytics(
                42L,
                List.of(new AnalyticsService.SubjectStats("Math", 82.5, 4.0, "Algebra", 12L)),
                3,
                82.5,
                List.of()
        ));
        when(model.chat(anyChatMessages())).thenReturn(answer("## Binary search\n\nIt halves the search range."));
        MentorAgent agent = new MentorAgent(model, analytics, new ObjectMapper(), students, messages, "test-key");

        String result = agent.run(42L, "Explain binary search");

        assertEquals("## Binary search\n\nIt halves the search range.", result);
        ArgumentCaptor<List<ChatMessage>> prompt = chatMessageCaptor();
        verify(model).chat(prompt.capture());
        List<ChatMessage> request = prompt.getValue();
        assertEquals(4, request.size());
        assertInstanceOf(SystemMessage.class, request.get(0));
        String systemPrompt = ((SystemMessage) request.get(0)).text();
        assertTrue(systemPrompt.contains("\"subject\":\"Math\""));
        assertTrue(systemPrompt.contains("Riya Patel"));
        assertTrue(systemPrompt.contains("silently check"));
        assertInstanceOf(UserMessage.class, request.get(1));
        assertEquals("Can you explain queues?", ((UserMessage) request.get(1)).singleText());
        assertInstanceOf(AiMessage.class, request.get(2));
        assertEquals("A queue is FIFO: first in, first out.", ((AiMessage) request.get(2)).text());
        assertInstanceOf(UserMessage.class, request.get(3));
        assertEquals("Explain binary search", ((UserMessage) request.get(3)).singleText());
        assertEquals(1, request.stream().filter(UserMessage.class::isInstance)
                .map(UserMessage.class::cast)
                .filter(message -> message.singleText().equals("Explain binary search"))
                .count(), "The current question must appear only once, as the final user turn.");
        verify(analytics).compute(42L);
        verify(students).findById(42L);
        verify(messages).findTop10ByStudentIdOrderByCreatedAtDescIdDesc(42L);
    }

    @Test
    void answersRegisteredIdentityQuestionsDeterministicallyForTheRequestedStudent() throws Exception {
        ChatModel model = mock(ChatModel.class);
        AnalyticsService analytics = mock(AnalyticsService.class);
        StudentRepo students = mock(StudentRepo.class);
        MessageRepo messages = mock(MessageRepo.class);
        when(students.findById(42L)).thenReturn(Optional.of(new Student("Raj Patel", null)));
        when(students.findById(43L)).thenReturn(Optional.of(new Student("Sam Lee", null)));
        when(messages.findTop10ByStudentIdOrderByCreatedAtDescIdDesc(42L)).thenReturn(List.of());
        when(messages.findTop10ByStudentIdOrderByCreatedAtDescIdDesc(43L)).thenReturn(List.of());
        when(analytics.compute(42L)).thenReturn(new AnalyticsService.Analytics(42L, List.of(), 0, 0, List.of()));
        when(analytics.compute(43L)).thenReturn(new AnalyticsService.Analytics(43L, List.of(), 0, 0, List.of()));
        MentorAgent agent = new MentorAgent(model, analytics, new ObjectMapper(), students, messages, "test-key");

        assertEquals("Your registered name is Raj Patel.", agent.run(42L, "What's my name?"));
        assertEquals("Your registered name is Raj Patel.", agent.run(42L, "Who am I?"));
        assertEquals("Your registered name is Sam Lee.", agent.run(43L, "What is my name?"));

        verify(students, times(2)).findById(42L);
        verify(students).findById(43L);
        verify(analytics, times(2)).compute(42L);
        verify(analytics).compute(43L);
        verify(messages, times(2)).findTop10ByStudentIdOrderByCreatedAtDescIdDesc(42L);
        verify(messages).findTop10ByStudentIdOrderByCreatedAtDescIdDesc(43L);
        verifyNoInteractions(model);
    }

    @Test
    void identityAnswerCanAcknowledgeConversationalNameWithoutReplacingRegisteredName() throws Exception {
        ChatModel model = mock(ChatModel.class);
        AnalyticsService analytics = mock(AnalyticsService.class);
        StudentRepo students = mock(StudentRepo.class);
        MessageRepo messages = mock(MessageRepo.class);
        when(students.findById(42L)).thenReturn(Optional.of(new Student("Raj Patel", null)));
        when(messages.findTop10ByStudentIdOrderByCreatedAtDescIdDesc(42L)).thenReturn(List.of(
                new MentorMessage(42L, "student", "Please call me RJ.")));
        when(analytics.compute(42L)).thenReturn(new AnalyticsService.Analytics(42L, List.of(), 0, 0, List.of()));
        MentorAgent agent = new MentorAgent(model, analytics, new ObjectMapper(), students, messages, "test-key");

        assertEquals("Your registered name is Raj Patel. You mentioned that you'd like me to call you RJ.",
                agent.run(42L, "Do you know my name?"));

        verify(students).findById(42L);
        verify(messages).findTop10ByStudentIdOrderByCreatedAtDescIdDesc(42L);
        verifyNoInteractions(model);
    }

    @Test
    void missingProfileDoesNotInventNameAndOrdinaryOrUnrelatedQuestionsUseTheModel() throws Exception {
        ChatModel model = mock(ChatModel.class);
        AnalyticsService analytics = mock(AnalyticsService.class);
        StudentRepo students = mock(StudentRepo.class);
        MessageRepo messages = mock(MessageRepo.class);
        when(students.findById(42L)).thenReturn(Optional.empty());
        when(messages.findTop10ByStudentIdOrderByCreatedAtDescIdDesc(42L)).thenReturn(List.of());
        when(analytics.compute(42L)).thenReturn(new AnalyticsService.Analytics(42L, List.of(), 0, 0, List.of()));
        when(model.chat(anyChatMessages())).thenReturn(answer("I don't have a registered name for you."));
        MentorAgent agent = new MentorAgent(model, analytics, new ObjectMapper(), students, messages, "test-key");

        assertEquals("I don't have a registered name for you.", agent.run(42L, "What is my name?"));
        assertEquals("I don't have a registered name for you.", agent.run(42L, "What is my username?"));
        assertEquals("I don't have a registered name for you.", agent.run(42L, "What is my friend's name?"));

        ArgumentCaptor<List<ChatMessage>> requests = chatMessageCaptor();
        verify(model, times(3)).chat(requests.capture());
        assertTrue(requests.getAllValues().stream().allMatch(request -> request.get(0) instanceof SystemMessage));
        assertTrue(requests.getAllValues().get(0).get(0).toString().contains("Registered student name"));
        verify(students, times(3)).findById(42L);
        verify(messages, times(3)).findTop10ByStudentIdOrderByCreatedAtDescIdDesc(42L);
    }

    @Test
    void boundsHistoryToTenRecentMessagesAndTruncatesOversizedEntries() throws Exception {
        ChatModel model = mock(ChatModel.class);
        AnalyticsService analytics = mock(AnalyticsService.class);
        StudentRepo students = mock(StudentRepo.class);
        MessageRepo messages = mock(MessageRepo.class);
        when(students.findById(42L)).thenReturn(Optional.of(new Student("Riya", null)));
        when(analytics.compute(42L)).thenReturn(new AnalyticsService.Analytics(42L, List.of(), 0, 0, List.of()));

        List<MentorMessage> recentFirst = new ArrayList<>();
        for (int index = 0; index < 12; index++) {
            String content = index == 0 ? "x".repeat(1_300) : "history-message-" + index;
            recentFirst.add(new MentorMessage(42L, "student", content));
        }
        when(messages.findTop10ByStudentIdOrderByCreatedAtDescIdDesc(42L)).thenReturn(recentFirst);
        when(model.chat(anyChatMessages())).thenReturn(answer("Here is the concise answer."));
        MentorAgent agent = new MentorAgent(model, analytics, new ObjectMapper(), students, messages, "test-key");

        agent.run(42L, "And what about that?");

        ArgumentCaptor<List<ChatMessage>> prompt = chatMessageCaptor();
        verify(model).chat(prompt.capture());
        List<ChatMessage> request = prompt.getValue();
        List<String> historyText = request.stream().skip(1).limit(request.size() - 2L)
                .map(message -> message instanceof UserMessage user ? user.singleText()
                        : message instanceof AiMessage ai ? ai.text() : "")
                .toList();
        assertEquals(10, historyText.size());
        assertTrue(historyText.contains("history-message-9"));
        assertFalse(historyText.contains("history-message-10"));
        assertTrue(historyText.get(historyText.size() - 1).endsWith("[truncated]"));
        assertTrue(historyText.get(historyText.size() - 1).length() <= 1_200);
        verify(messages).findTop10ByStudentIdOrderByCreatedAtDescIdDesc(42L);
    }

    @Test
    void keepsConversationHistoryScopedToTheRequestedStudentId() throws Exception {
        ChatModel model = mock(ChatModel.class);
        AnalyticsService analytics = mock(AnalyticsService.class);
        StudentRepo students = mock(StudentRepo.class);
        MessageRepo messages = mock(MessageRepo.class);
        when(students.findById(42L)).thenReturn(Optional.of(new Student("Riya", null)));
        when(students.findById(43L)).thenReturn(Optional.of(new Student("Sam", null)));
        when(analytics.compute(42L)).thenReturn(new AnalyticsService.Analytics(42L, List.of(), 0, 0, List.of()));
        when(analytics.compute(43L)).thenReturn(new AnalyticsService.Analytics(43L, List.of(), 0, 0, List.of()));
        when(messages.findTop10ByStudentIdOrderByCreatedAtDescIdDesc(42L)).thenReturn(List.of(
                new MentorMessage(42L, "student", "private history for student 42")));
        when(messages.findTop10ByStudentIdOrderByCreatedAtDescIdDesc(43L)).thenReturn(List.of(
                new MentorMessage(43L, "student", "private history for student 43")));
        when(model.chat(anyChatMessages())).thenReturn(answer("Answer"));
        MentorAgent agent = new MentorAgent(model, analytics, new ObjectMapper(), students, messages, "test-key");

        agent.run(42L, "Follow up A");
        agent.run(43L, "Follow up B");

        ArgumentCaptor<List<ChatMessage>> prompts = chatMessageCaptor();
        verify(model, times(2)).chat(prompts.capture());
        List<List<ChatMessage>> requests = prompts.getAllValues();
        assertTrue(requests.get(0).stream().anyMatch(message -> messageContent(message).contains("private history for student 42")));
        assertFalse(requests.get(0).stream().anyMatch(message -> messageContent(message).contains("private history for student 43")));
        assertTrue(requests.get(1).stream().anyMatch(message -> messageContent(message).contains("private history for student 43")));
        assertFalse(requests.get(1).stream().anyMatch(message -> messageContent(message).contains("private history for student 42")));
        verify(messages).findTop10ByStudentIdOrderByCreatedAtDescIdDesc(42L);
        verify(messages).findTop10ByStudentIdOrderByCreatedAtDescIdDesc(43L);
    }

    @Test
    void returnsFriendlyRateLimitMessageWithoutRetryingTheModelCall() throws Exception {
        ChatModel model = mock(ChatModel.class);
        AnalyticsService analytics = mock(AnalyticsService.class);
        StudentRepo students = mock(StudentRepo.class);
        MessageRepo messages = mock(MessageRepo.class);
        when(analytics.compute(42L)).thenReturn(new AnalyticsService.Analytics(42L, List.of(), 0, 0.0, List.of()));
        when(model.chat(anyChatMessages())).thenThrow(new HttpException(429, "rate limit exceeded"));
        MentorAgent agent = new MentorAgent(model, analytics, new ObjectMapper(), students, messages, "test-key");

        MentorRequestException failure = assertThrows(
                MentorRequestException.class,
                () -> agent.run(42L, "Explain binary search")
        );

        assertTrue(failure.getMessage().contains("rate-limited"));
        verify(model, times(1)).chat(anyChatMessages());
    }

    private static List<ChatMessage> anyChatMessages() {
        return any();
    }

    @SuppressWarnings("unchecked")
    private static ArgumentCaptor<List<ChatMessage>> chatMessageCaptor() {
        return (ArgumentCaptor<List<ChatMessage>>) (ArgumentCaptor<?>) ArgumentCaptor.forClass(List.class);
    }

    private static ChatResponse answer(String text) {
        return ChatResponse.builder().aiMessage(AiMessage.from(text)).build();
    }

    private static String messageContent(ChatMessage message) {
        if (message instanceof UserMessage user) return user.singleText();
        if (message instanceof AiMessage ai) return ai.text();
        if (message instanceof SystemMessage system) return system.text();
        return "";
    }
}
