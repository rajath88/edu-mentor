package com.edumentor.agent;

import org.bsc.langgraph4j.state.AgentState;
import java.util.Map;
import java.util.List;

public class MentorState extends AgentState {
    public MentorState(Map<String, Object> init) { super(init); }
    public Long studentId()   { return this.<Long>value("studentId").orElse(0L); }
    public String question()  { return this.<String>value("question").orElse(""); }
    public String analytics() { return this.<String>value("analytics").orElse(""); }
    public String studentName() { return this.<String>value("studentName").orElse("student"); }
    public List<Map<String, String>> conversationHistory() {
        return this.<List<Map<String, String>>>value("conversationHistory").orElse(List.of());
    }
    public String plan()      { return this.<String>value("plan").orElse(""); }
}
