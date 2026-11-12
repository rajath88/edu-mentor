
package com.edumentor.agent;

import com.edumentor.service.AnalyticsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.langchain4j.exception.HttpException;
import dev.langchain4j.model.chat.ChatModel;
import org.bsc.langgraph4j.CompiledGraph;
import org.bsc.langgraph4j.StateGraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Map;

import static org.bsc.langgraph4j.StateGraph.END;
import static org.bsc.langgraph4j.StateGraph.START;
import static org.bsc.langgraph4j.action.AsyncNodeAction.node_async;

@Component
public class MentorAgent {

    private static final Logger log = LoggerFactory.getLogger(MentorAgent.class);

    private final CompiledGraph<MentorState> graph;
    private final String apiKey;

    public MentorAgent(
            ChatModel llm,
            AnalyticsService analyticsService,
            ObjectMapper json,
            @Value("${llm.api-key:}") String apiKey
    ) throws Exception {
        this.apiKey = apiKey;

        StateGraph<MentorState> g =
                new StateGraph<>(Map.of(), MentorState::new);

        // STEP 1: Analyze student data
        g.addNode("analyze", node_async(s ->
                Map.of(
                        "analytics",
                        toJson(json, analyticsService.compute(s.studentId()))
                )
        ));

        // STEP 2: Plan, self-review, and return the final answer in one model call.
        g.addNode("plan", node_async(s -> {
            String prompt = """
                    You are EduMentor, a friendly and knowledgeable tutor. Answer the student's
                    actual question directly using your general knowledge. Use academic data only
                    when it helps personalize the answer; never invent student records or claim
                    missing data prevents you from answering.

                    Student academic data (JSON):
                    %s

                    Student question:
                    %s

                    Explain clearly and include useful examples, steps, or code as appropriate.
                    Before responding, silently check that your answer is relevant, complete,
                    accurate, and does not invent student details; revise it if needed. Return only
                    the polished final answer, using standard Markdown where helpful. Do not escape
                    Markdown markers or encode spaces as HTML entities. Add a brief study suggestion
                    only when it is relevant.
                    """.formatted(s.analytics(), s.question());

            return Map.of("plan", llm.chat(prompt));
        }));

        // STEP 4: Connect workflow
        g.addEdge(START, "analyze");
        g.addEdge("analyze", "plan");
        g.addEdge("plan", END);

        this.graph = g.compile();
    }

    // Run Mentor
    public String run(Long studentId, String question) {

        if (studentId == null) {
            return "Please enter your name first to use Mentor.";
        }

        if (question == null || question.isBlank()) {
            return "Please enter a question for your Mentor.";
        }

        try {
            return graph.invoke(Map.of(
                            "studentId", studentId,
                            "question", question
                    ))
                    .map(state -> state.plan())
                    .orElse("The mentor could not produce an answer.");

        } catch (Exception failure) {
            HttpException httpFailure = GroqErrorDetails.findHttpException(failure);
            if (httpFailure != null) {
                String body = GroqErrorDetails.sanitize(httpFailure.getMessage(), apiKey);
                log.error("Groq API request failed: HTTP {} responseBody={}",
                        httpFailure.statusCode(), body);
                throw new MentorRequestException(
                        GroqErrorDetails.clientMessage(httpFailure.statusCode(), httpFailure.getMessage())
                );
            }

            Throwable rootCause = GroqErrorDetails.rootCause(failure);
            String safeCauseMessage = GroqErrorDetails.sanitize(rootCause.getMessage(), apiKey);
            if (GroqErrorDetails.isTimeout(failure)) {
                log.warn("Groq API request timed out: causeType={} causeMessage={}",
                        rootCause.getClass().getName(), safeCauseMessage);
                throw new MentorRequestException(GroqErrorDetails.timeoutClientMessage());
            }

            log.error("AI Mentor workflow failed: causeType={} causeMessage={}",
                    rootCause.getClass().getName(),
                    safeCauseMessage);
            throw new MentorRequestException("AI Mentor is temporarily unavailable. Please try again.");
        }
    }

    private static String toJson(ObjectMapper m, Object o) {
        try {
            return m.writeValueAsString(o);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
