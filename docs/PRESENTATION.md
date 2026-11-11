# EduMentor — 12-Slide Presentation Outline

Target duration: 7–10 minutes. Keep most slides to 30–45 seconds and spend extra time on architecture and the mentor workflow.

## 1. Title — EduMentor
- Student dashboard for academic records, summaries, and study help.
- Presenter: [Name], [Course / institution].
- **Suggested visual:** Dashboard screenshot.
- **Speaker notes:** Introduce the prototype and clarify that some visual modules are demonstration content.

## 2. Problem statement
- Scores, exam dates, and study help can be scattered across tools.
- Raw marks do not readily show subject or topic patterns.
- **Suggested visual:** Score sheet, calendar, and notes shown separately.
- **Speaker notes:** Explain the motivation without claiming measured user outcomes.

## 3. Proposed solution
- Store profiles, marks, exams, and mentor conversations through an API.
- Compute subject summaries and provide a contextual AI mentor.
- **Suggested visual:** Records → Analytics → Mentor.
- **Speaker notes:** Distinguish persisted backend records from demo-only course and quiz screens.

## 4. Objectives
- Build a React SPA and Java REST service.
- Demonstrate relational persistence, schema migration, caching, containers, and AI orchestration.
- **Suggested visual:** Objective checklist.
- **Speaker notes:** Present these as engineering objectives, not performance claims.

## 5. System architecture
- Browser communicates with Spring Boot through Nginx in Compose.
- PostgreSQL stores records; Valkey supports cache and rate-limit counters.
- **Suggested visual:** Use the system diagram in ARCHITECTURE.md.
- **Speaker notes:** This is the configured local Compose topology; no cloud deployment manifest was found.

## 6. Technology stack
- React, Vite, JavaScript, Tailwind, Axios, Recharts, Lucide.
- Java 21, Spring Boot, JPA, Flyway, PostgreSQL, Valkey.
- LangChain4j, LangGraph4j, Groq, Docker, Nginx.
- **Suggested visual:** Layered stack diagram.
- **Speaker notes:** Groq is the active model through LangChain4j's OpenAI-compatible chat client.

## 7. Frontend modules
- Dashboard, marks, analytics, exams, AI Mentor, courses, quizzes, settings.
- React hooks manage local state; localStorage remembers student display identity. Marks and exams load from the backend.
- **Suggested visual:** Real screenshots of marks and mentor pages.
- **Speaker notes:** Marks and exams are loaded from the backend. Course progress, quiz content, study hours, and streak remain hard-coded demo content.

## 8. Backend and database
- Controller validates requests and delegates to services.
- Spring Data repositories persist four core entity types through JPA.
- Flyway creates schema; Hibernate validates it.
- **Suggested visual:** Controller → Service → Repository → PostgreSQL.
- **Speaker notes:** Exam create/list/delete routes are implemented; mark update/delete routes are not implemented.

## 9. AI Mentor architecture
- Analyze node computes student analytics.
- Plan node asks Groq using question and context.
- Critique node can accept or request a bounded revision.
- **Suggested visual:** Analyze → Plan → Critique → optional revision → final answer.
- **Speaker notes:** There is no RAG, vector database, or streaming. A critique pass does not guarantee factual correctness.

## 10. Demo workflow
- Create a profile, inspect marks/analytics, add an exam, ask the mentor.
- **Suggested visual:** Short live walkthrough or screen recording.
- **Speaker notes:** Add a mark through the Marks form, then show the updated dashboard. Add, refresh, and delete an exam to demonstrate database persistence.

## 11. Limitations and future enhancements
- No authentication; some course and quiz UI data is sample content.
- Add secure identity, mark update/delete, broader automated tests, CI, and reproducible cloud deployment configuration.
- **Suggested visual:** Current state / next steps roadmap.
- **Speaker notes:** No Render or Vercel deployment manifest is present.

## 12. Conclusion
- Full-stack prototype for persisted records and subject analytics.
- Graph-orchestrated mentor combines analytics with a general study question.
- **Suggested visual:** Architecture recap or final dashboard.
- **Speaker notes:** Summarize the implementation and invite questions about the data flow, cache, migrations, and AI graph.
