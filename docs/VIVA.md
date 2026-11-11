# EduMentor Viva Questions and Answers

## Project overview

1. **What is EduMentor?** A student dashboard backed by an API for profiles, marks, exams, analytics, and mentor questions.
2. **What problem does it address?** It brings academic records, simple summaries, and study assistance into one prototype.
3. **Which features persist?** Student profiles, marks, exams created through the API, and mentor messages are stored in PostgreSQL.
4. **Which screens use demo data?** Courses/progress, quizzes, weekly study hours, and streak are hard-coded in the frontend.
5. **Does the app authenticate students?** No. A student ID and name in localStorage do not prove identity to the backend.

## React and Vite

6. **Why React?** It supports a component-based UI and hook-managed interactive state.
7. **What does Vite do?** It serves the frontend during development and builds static assets.
8. **How does the frontend call the API?** Axios uses `VITE_API_BASE_URL` when set, localhost during development by default, and same-origin `/api` as the production fallback.
9. **Where is frontend state stored?** Mostly in React hooks; localStorage remembers student display identity. Marks and exams are fetched from the backend.
10. **Is Redux used?** No dedicated global state library is declared.
11. **How is the app styled?** Tailwind CSS v4 utilities and custom CSS.
12. **What does Recharts provide?** Chart components used for score analytics calculated from saved marks; course and quiz sections still contain demo data.

## Spring Boot and REST

13. **What does Spring Boot provide?** Web runtime, dependency injection, JPA, validation, cache integration, and actuator.
14. **How is dependency injection used?** Controllers and services receive dependencies through constructors.
15. **What is a REST API?** HTTP resource operations using methods, paths, and representations such as JSON.
16. **How are requests validated?** Jakarta constraints on request records are activated with @Valid.
17. **How are errors handled?** IllegalArgumentException maps to 404; provider failures return safe, friendly 502 messages; validation errors use Spring handling.
18. **Which API routes exist?** Student create; mark create/list; exam create/list/delete; analytics read; mentor ask/history, all under /api.
19. **Can the UI add marks?** Yes. The Marks screen posts the subject, topic, score, maximum score, and optional date to the API, then reloads records and analytics.

## Database and migrations

20. **Why PostgreSQL?** It supports relational constraints and indexed queries over linked student records.
21. **What are the main tables?** students, marks, exams, and mentor_messages.
22. **What does JPA do?** Maps Java entity classes to relational tables and supports repository persistence.
23. **What is Flyway used for?** Applying versioned SQL migrations to create and evolve the schema.
24. **What does ddl-auto validate mean?** Hibernate checks entity mappings against the schema without creating or altering it.
25. **What is the foreign-key behavior?** Deleting a student cascades to dependent marks, exams, and messages.
26. **Why is marks indexed by student and date?** To support student mark queries ordered by date.

## Analytics and caching

27. **How is subject average calculated?** Each mark becomes a score/maxScore percentage, then those percentages are averaged per subject.
28. **How is trend calculated?** The latest three percentage average minus the earlier average; fewer than four marks gives zero.
29. **How is weakest topic chosen?** The topic with the lowest mean mark percentage.
30. **How are days to exam calculated?** Calendar days until the nearest exam on or after the current date for that subject.
31. **What is Valkey used for?** Spring Cache analytics entries and mentor rate-limit counters.
32. **How is the analytics cache refreshed?** Mark and exam writes evict the student's cache key; entries also expire after ten minutes.

## AI workflow

33. **What does LangChain4j do?** It provides the Java integration used to call Groq through its OpenAI-compatible ChatModel.
34. **What does LangGraph4j do?** It orchestrates analyze, plan, and critique nodes with a conditional revision edge, then returns the final plan response.
35. **What context is sent to the model?** The student's question, serialized analytics, and critique feedback on a retry.
36. **What does the critique step do?** It asks the model to approve or suggest a revision; retries are bounded.
37. **Does the project use RAG or a vector database?** No retrieval pipeline or vector database was found in the implementation.
38. **Does the mentor stream responses?** No. The API returns a completed response.
39. **Which model is active?** Groq via LangChain4j's OpenAI-compatible client. The server reads `LLM_MODEL` (default `openai/gpt-oss-120b`), `LLM_API_KEY`, and optional `LLM_BASE_URL` from environment configuration.
40. **What if the model call fails?** The server logs sanitized provider diagnostics and returns a friendly 502 message for rate limits, quota exhaustion, timeouts, or server errors.

## Docker, deployment, and security

41. **What services run in Compose?** Nginx, the Java app, PostgreSQL, and Valkey.
42. **What does the Dockerfile build?** A Maven-built Java 21 JAR, then runs it in a Java 21 JRE container as a non-root user.
43. **What does Nginx do?** Serves checked-in static files and proxies API and health requests.
44. **Does the Dockerfile build React assets?** No. It builds only the backend; Nginx serves the checked-in nginx/html directory.
45. **Are Render or Vercel configured?** No deployment manifests were found; a CORS rule alone does not prove deployment.
46. **How is the backend port selected?** Spring uses `PORT`, then `SERVER_PORT`, then 8080. Compose maps the backend to localhost port 8080, while Render can supply its own `PORT`.
47. **What does CORS protect?** It controls permitted browser origins, not user authentication or resource authorization.
48. **How does rate limiting work?** Valkey tracks a fixed-window counter by client IP; requests over 10/minute are rejected, and Valkey errors fail open.
49. **How are exams persisted?** The UI posts new exams, loads the saved schedule from the API, and deletes by exam ID; the backend checks student ownership and invalidates analytics.
50. **What would you improve next?** Add authentication/authorization, mark update/delete, data-backed course and quiz modules, broader tests/CI, and checked-in cloud deployment configuration.
