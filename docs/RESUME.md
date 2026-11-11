# EduMentor — Resume Entry

**One-line description:** Built a student dashboard with a React frontend and Spring Boot API for academic records, subject analytics, and an LLM-powered study mentor.

## Resume bullets

- Developed a React and Vite dashboard integrated with REST endpoints for student profiles, marks, exams, and analytics.
- Designed PostgreSQL entities and Flyway migrations for student, mark, exam, and mentor conversation records.
- Implemented subject-level average, recent-score trend, weakest-topic, and days-to-exam calculations.
- Built a LangGraph4j workflow using LangChain4j and Groq for analytics-informed tutoring with bounded critique and revision.
- Added Valkey-backed analytics caching with write-triggered eviction and best-effort per-IP mentor rate limiting.

**Technologies:** Java 21, Spring Boot 3.4.5, Spring Data JPA, Jakarta Validation, PostgreSQL, Flyway, Valkey, Spring Cache, LangChain4j 1.3.0, LangGraph4j 1.6.2, React 19.3.1, Vite 8.3.5, JavaScript, Tailwind CSS 4.3.4, Axios, Recharts, Lucide React, Docker, Docker Compose, Nginx.

**Architecture highlights:** React SPA → Nginx → Spring REST API and services → PostgreSQL and Valkey. Mentor requests flow through a stateful analyze/plan/critique graph to the Groq ChatModel.

**Scope note:** Course progress, quizzes, weekly study hours, and streak are sample UI data. Marks and exam create/list/delete operations use the backend. Groq model, key, and optional base URL are configured through server-side environment variables.
