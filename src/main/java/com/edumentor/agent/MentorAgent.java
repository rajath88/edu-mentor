package com.edumentor.agent;

import com.edumentor.service.AnalyticsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.langchain4j.model.chat.ChatModel;
import org.bsc.langgraph4j.CompiledGraph;
import org.bsc.langgraph4j.StateGraph;
import org.springframework.stereotype.Component;

import java.util.Map;

import static org.bsc.langgraph4j.StateGraph.END;
import static org.bsc.langgraph4j.StateGraph.START;
import static org.bsc.langgraph4j.action.AsyncEdgeAction.edge_async;
import static org.bsc.langgraph4j.action.AsyncNodeAction.node_async;

/**
 * Agent workflow:
 * analyze (tool: DB + Valkey) -> plan (LLM) -> critique (LLM) -> revise loop (max 2) -> answer
 */
@Component
public class MentorAgent {

    private static final int MAX_REVISIONS = 2;
    private final CompiledGraph<MentorState> graph;

    public MentorAgent(ChatModel llm, AnalyticsService analyticsService, ObjectMapper json) throws Exception {
        StateGraph<MentorState> g = new StateGraph<>(Map.of(), MentorState::new);

        g.addNode("analyze", node_async(s ->
                Map.of("analytics", toJson(json, analyticsService.compute(s.studentId())))));

        g.addNode("plan", node_async(s -> {
            String feedback = s.critique().isBlank() ? "" :
                    "\nA reviewer rejected your previous plan with this feedback, fix it:\n" + s.critique();
            String prompt = """
                    You are a supportive, practical study mentor. Use ONLY the data below.
                    Student data (percentages, trend = recent minus earlier, daysToExam):
                    %s

                    Student question: %s
                    %s
                    Produce a concise prioritized study plan: what to study first, how much time per day,
                    and one concrete tip per weak topic. Subjects with the nearest exams come first.
                    """.formatted(s.analytics(), s.question(), feedback);
            return Map.of("plan", llm.chat(prompt), "iterations", s.iterations() + 1);
        }));

        g.addNode("critique", node_async(s -> {
            String prompt = """
                    Review this study plan against the student data. Check: nearest exams prioritized,
                    weak topics covered, time is realistic, no invented facts.
                    Reply with exactly "OK" if acceptable, otherwise "REVISE: <one-sentence reason>".

                    DATA: %s
                    PLAN: %s
                    """.formatted(s.analytics(), s.plan());
            return Map.of("critique", llm.chat(prompt).trim());
        }));

        g.addEdge(START, "analyze");
        g.addEdge("analyze", "plan");
        g.addEdge("plan", "critique");
        g.addConditionalEdges("critique",
                edge_async(s -> s.critique().startsWith("REVISE") && s.iterations() <= MAX_REVISIONS
                        ? "revise" : "done"),
                Map.of("revise", "plan", "done", END));

        this.graph = g.compile();
    }

    public String run(Long studentId, String question) {
        return graph.invoke(Map.of("studentId", studentId, "question", question))
                .map(state -> state.plan())
                .orElse("The mentor could not produce a plan.");
    }

    private static String toJson(ObjectMapper m, Object o) {
        try { return m.writeValueAsString(o); } catch (Exception e) { throw new RuntimeException(e); }
    }
}
