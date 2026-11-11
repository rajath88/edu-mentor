
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

@Component
public class MentorAgent {

    private static final int MAX_REVISIONS = 2;

    private final CompiledGraph<MentorState> graph;

    public MentorAgent(
            ChatModel llm,
            AnalyticsService analyticsService,
            ObjectMapper json
    ) throws Exception {

        StateGraph<MentorState> g =
                new StateGraph<>(Map.of(), MentorState::new);

        // STEP 1: Analyze student data
        g.addNode("analyze", node_async(s ->
                Map.of(
                        "analytics",
                        toJson(json, analyticsService.compute(s.studentId()))
                )
        ));

        // STEP 2: Answer the student's question
        g.addNode("plan", node_async(s -> {

            String feedback = s.critique().isBlank()
                    ? ""
                    : "\nImprove your previous response using this feedback:\n"
                    + s.critique();

            String prompt = """
                    You are EduMentor, an intelligent, friendly,
                    knowledgeable AI tutor and academic mentor.

                    YOUR PRIMARY RESPONSIBILITY:
                    Answer the student's actual question directly.
                    You are a tutor, NOT just a study-plan generator.

                    STUDENT ACADEMIC DATA:
                    %s

                    STUDENT QUESTION:
                    %s

                    %s

                    IMPORTANT RULES:
                    1. Answer the student's question FIRST.
                    2. Use your general knowledge to explain concepts,
                       solve problems, teach programming, and answer questions.
                    3. Never restrict your answer to the academic data.
                    4. Never say a topic is unavailable just because
                       it is not present in the student's records.
                    5. If asked to explain something, explain it clearly
                       with examples and step-by-step reasoning when useful.
                    6. If asked a mathematical question, solve it.
                    7. If asked a programming question, provide relevant
                       code and explain it.
                    8. Use academic data ONLY when it helps personalize
                       the answer or provide relevant recommendations.
                    9. If subjects, marks, or exams are missing,
                       still answer the question completely.
                    10. After answering, optionally add a short suggestion
                        to add subjects, exam dates, or marks if useful.
                    11. Never invent academic records or student details.
                    12. Keep the response clear, helpful, and relevant.

                    RESPONSE FORMAT:
                    - Direct answer to the question.
                    - Explanation/examples/solution where appropriate.
                    - Personalized recommendations if relevant.
                    - Optional brief academic-data suggestion at the end.

                    """.formatted(
                    s.analytics(),
                    s.question(),
                    feedback
            );

            return Map.of(
                    "plan", llm.chat(prompt),
                    "iterations", s.iterations() + 1
            );
        }));

        // STEP 3: Review the answer
        g.addNode("critique", node_async(s -> {

            String prompt = """
                    You are reviewing an AI tutor's response.

                    STUDENT QUESTION:
                    %s

                    STUDENT DATA:
                    %s

                    TUTOR RESPONSE:
                    %s

                    Check whether:
                    - The tutor actually answered the student's question.
                    - The answer is educationally useful and relevant.
                    - The answer does not unnecessarily depend on missing
                      student subjects, marks, or exam data.
                    - The response does not invent student information.
                    - The explanation is sufficiently clear.

                    Do NOT reject a response merely because student data
                    is missing.

                    Reply with exactly "OK" if acceptable.
                    Otherwise reply:
                    REVISE: <one-sentence reason>
                    """.formatted(
                    s.question(),
                    s.analytics(),
                    s.plan()
            );

            return Map.of("critique", llm.chat(prompt).trim());
        }));

        // STEP 4: Connect workflow
        g.addEdge(START, "analyze");
        g.addEdge("analyze", "plan");
        g.addEdge("plan", "critique");

        g.addConditionalEdges(
                "critique",
                edge_async(s ->
                        s.critique().startsWith("REVISE")
                                && s.iterations() <= MAX_REVISIONS
                                ? "revise"
                                : "done"
                ),
                Map.of(
                        "revise", "plan",
                        "done", END
                )
        );

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

        } catch (Exception e) {

            System.out.println("========== MENTOR ERROR ==========");
            e.printStackTrace();

            throw new RuntimeException(
                    "MentorAgent failed: " + e.getMessage(),
                    e
            );
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
