package com.edumentor.agent;

import org.bsc.langgraph4j.state.AgentState;
import java.util.Map;

public class MentorState extends AgentState {
    public MentorState(Map<String, Object> init) { super(init); }
    public Long studentId()   { return this.<Long>value("studentId").orElse(0L); }
    public String question()  { return this.<String>value("question").orElse(""); }
    public String analytics() { return this.<String>value("analytics").orElse(""); }
    public String plan()      { return this.<String>value("plan").orElse(""); }
    public String critique()  { return this.<String>value("critique").orElse(""); }
    public int iterations()   { return this.<Integer>value("iterations").orElse(0); }
}
