# EduMentor

EduMentor is a student learning dashboard backed by a Spring Boot REST API. It stores student profiles, marks, exams, and mentor conversations; computes subject-level summaries; and provides an AI mentor that receives academic context.

## Problem and objectives

Student scores, exam dates, and study help are often handled separately. EduMentor brings student records and simple performance summaries into one interface and demonstrates a full-stack application using a React SPA, Java REST API, relational database, cache, and graph-based LLM orchestration.

## Feature status

**Implemented:** create student profiles; create and list marks through the API; create exams through the API; compute per-subject average, trend, weakest topic, and days until next exam; ask the AI Mentor and retrieve stored conversation history through the API; PostgreSQL persistence; Flyway migration; Valkey-backed analytics cache and best-effort mentor rate limiting.

**Implemented:** marks can be entered from the frontend and are saved through the API. Exams can be created, listed, and deleted through the API; the schedule is loaded from PostgreSQL. Mentor history exists as an endpoint but the UI does not load it. Student ID/name in localStorage are not authentication.

**Demo-only:** course catalog/progress, quizzes, weekly study hours, and learning streak shown in the UI are hard-coded sample content, not persisted backend features.

## Technology stack

| Area | Verified versions and use |
|---|---|
| Frontend | React and React DOM 19.3.1, Vite 8.3.5, JavaScript ES modules |
| Styling and UI | Tailwind CSS 4.3.4 with Vite plugin, custom CSS, Lucide React 1.67.0 |
| Charts and HTTP | Recharts 3.10.1, Axios ^1.21.0 |
| Backend | Java 21, Spring Boot 3.4.5, Spring MVC, Spring Data JPA, Jakarta Validation, Spring Cache, Actuator |
| AI orchestration | LangChain4j 1.3.0, LangGraph4j 1.6.2; active chat model is Gemini |
| Persistence/cache | PostgreSQL (Compose image 16-alpine), Flyway, Valkey 8, HikariCP |
| Packaging/serving | Maven, Docker, Docker Compose, Nginx 1.27-alpine |

The frontend uses React hooks and localStorage rather than a dedicated state-management library. The POM declares Ollama, Gemini, and OpenAI-compatible LangChain4j integrations; the active AiConfig bean constructs Gemini directly. HikariCP is configured with maximum pool size 5 and minimum idle 0.

## Architecture

~~~mermaid
flowchart LR
  U[Student browser: React SPA] --> N[Nginx static server and proxy]
  N -->|/api and health| A[Spring Boot REST API]
  A --> S[Services and LangGraph4j Mentor]
  S --> P[(PostgreSQL)]
  S --> V[(Valkey cache and rate counters)]
  S --> L[Gemini ChatModel through LangChain4j]
~~~

### Frontend

Vite mounts the React application from frontend/src. App.jsx implements dashboard, courses, marks, exams, mentor, quizzes, analytics, and settings views. Axios reads `VITE_API_BASE_URL`; local development falls back to `http://localhost:8080/api`, while production defaults to same-origin `/api` (suitable behind the included Nginx proxy). A separate Vercel frontend must set `VITE_API_BASE_URL` to the Render API URL ending in `/api`. Tailwind utilities and custom CSS style the interface; Recharts provides graphs and Lucide React provides icons. Student display identity uses localStorage; marks and exams load from the API.

### Backend

- ApiController maps /api routes, validates request records, and delegates to services.
- MarkService creates students, marks, and exams and invalidates analytics after mark/exam writes.
- AnalyticsService calculates subject summaries and uses Spring Cache.
- MentorAgent and MentorState define the graph workflow and its state.
- AiConfig provides the active Gemini ChatModel bean.
- Repos and domain classes define Spring Data repositories and JPA entities.
- RateLimitFilter applies a per-IP fixed-window limit to mentor routes using Valkey.

Dependencies are injected through constructors. IllegalArgumentException maps to HTTP 404. Mentor runtime failures are logged server-side and returned as a generic 502. Spring handles validation errors; the application does not define one custom error envelope for all errors.

### AI Mentor workflow

1. The controller validates the question and parses the student ID.
2. RateLimitFilter checks a per-IP Valkey counter; the limiter continues best-effort if Valkey has a data-access failure.
3. The graph analyze node computes student analytics and serializes them into graph state.
4. The plan node sends the question, analytics, and any critique feedback to the ChatModel.
5. The critique node asks the model whether the answer is relevant and clear. A conditional edge can request a bounded revision.
6. The controller stores the question and final response in mentor_messages.

AiConfig reads the server-side `LLM_API_KEY`, `LLM_MODEL` (default `gemini-3.5-flash-lite`), and optional `LLM_BASE_URL`. A missing API key prevents backend startup with a clear configuration error. Temperature is 0.4 and timeout is 60 seconds. No RAG, vector database, streaming, or tool-calling implementation was found.

### Database design

Flyway migration V1__init.sql creates:

| Table | Purpose |
|---|---|
| students | ID, name, unique optional email |
| marks | Student-linked subject/topic score, maximum score, and date |
| exams | Student-linked subject and exam date |
| mentor_messages | Student-linked role, content, and creation timestamp |

Foreign keys from marks, exams, and mentor_messages cascade on student deletion. An index covers marks(student_id, taken_on). JPA is configured with ddl-auto: validate, leaving schema changes to Flyway.

## API reference

All routes use the /api prefix. Bodies are JSON.

| Method and route | Request and behavior |
|---|---|
| POST /students | name required, email optional; returns created student (201) |
| POST /students/{id}/marks | subject, topic, score >= 0, maxScore > 0, optional takenOn; returns mark (201) |
| GET /students/{id}/marks | Returns marks ordered by date ascending |
| POST /students/{id}/exams | subject and examDate required; returns exam (201) |
| GET /students/{id}/exams | Returns exams ordered by date |
| DELETE /students/{id}/exams/{examId} | Deletes an exam owned by the specified student (204) |
| GET /students/{id}/analytics | Returns student ID and subject summaries |
| POST /mentor/{id}/ask | question required; returns answer or generic 502 on model failure |
| GET /mentor/{id}/history | Returns up to ten recent messages, newest first |

There is no mark update/delete endpoint. Exam deletion verifies that the exam belongs to the specified student. Mark scores are not constrained to be less than or equal to maxScore. CORS permits local development origins and `https://*.vercel.app` by default, including Vercel preview domains. Set `CORS_ALLOWED_ORIGINS` on the backend to comma-separated origin patterns if the production frontend uses a custom domain. CORS explicitly permits the API's GET, POST, DELETE, and OPTIONS methods.

## Local setup

Requirements: Java 21, Maven, Node.js/npm, PostgreSQL, and Valkey.

1. Start PostgreSQL and Valkey locally, or use Docker Compose.
2. Configure variables from `.env.example`; keep actual credentials in the ignored `.env` file and never commit them.
3. Run `mvn spring-boot:run` from the repository root. Spring resolves the port as `PORT`, then `SERVER_PORT`, then `8080`.
4. In `frontend`, run `npm ci` and `npm run dev`. The development API default is `http://localhost:8080/api` and can be overridden with `VITE_API_BASE_URL`.
5. Run `npm run build` in `frontend` to create `frontend/dist`.

Use frontend/package-lock.json; the root package-lock.json is only a small placeholder.

## Docker Compose

Copy `.env.example` to `.env`, replace the sample database password, and set `LLM_API_KEY` for Gemini requests. Then run `docker compose up --build` and open `http://localhost`. Compose starts Nginx, the Java app, PostgreSQL, and Valkey. PostgreSQL uses a named `pgdata` volume. The backend is mapped to `127.0.0.1:8080`; Nginx proxies `/api` to the app on its internal port 8080. Render's injected `PORT` takes precedence over the Compose/local server port settings.

Nginx serves the checked-in nginx/html directory. The Dockerfile builds only the backend JAR and does not build/copy frontend assets, so source frontend changes are not reflected in the mounted static site unless assets are refreshed separately.

## Environment and deployment notes

`DB_URL`, `DB_USER`, and `DB_PASSWORD` configure PostgreSQL; `VALKEY_HOST` and `VALKEY_PORT` configure Valkey; `LLM_API_KEY`, `LLM_MODEL`, and optional `LLM_BASE_URL` configure the server-side Gemini integration. `PORT` (highest priority) or `SERVER_PORT` configures Spring's port. `CORS_ALLOWED_ORIGINS` optionally overrides the comma-separated default patterns. `VITE_API_BASE_URL` is a frontend build-time variable and must contain only the public API URL, never credentials. Flyway runs the packaged SQL migrations on startup; Hibernate validates the mapped schema.

### Vercel frontend

No Vercel project manifest is checked in. Configure the Vercel project with Root Directory `frontend`, framework preset Vite, install command `npm ci`, build command `npm run build`, and output directory `dist`. Set `VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api` in the Vercel project for the Production environment (and Preview if previews should call the backend). The actual service URL is account-specific and must be taken from the Render dashboard. Redeploy after setting build-time variables.

### Render backend

No Render Blueprint is checked in. Create a Docker web service from the repository root so Render uses the root `Dockerfile`; the image uses Java 21 and listens on `0.0.0.0` at the injected `PORT` (the application falls back to `SERVER_PORT`, then 8080). Configure `DB_URL` as a JDBC PostgreSQL URL, plus `DB_USER`, `DB_PASSWORD`, `VALKEY_HOST`, and `VALKEY_PORT` for production services. Configure `LLM_API_KEY` as a Render secret and optionally set `LLM_MODEL` and `LLM_BASE_URL`. For a custom Vercel domain, set `CORS_ALLOWED_ORIGINS` to the exact frontend origin (scheme and host, no path); the default supports `https://*.vercel.app`. Do not put any secret in Vercel variables or frontend files. Actuator health is available at `/actuator/health` and can be used as Render's health check path.

The application requires PostgreSQL and a Gemini API key to start. Flyway is enabled and applies migrations packaged under `src/main/resources/db/migration`; JPA uses `ddl-auto: validate`. Render Postgres and Valkey resources must be provisioned and their private connection values entered in the backend environment. Neither cloud provider configuration nor a deployed service was available for this repository audit, so cloud settings and live endpoints are not verified.

Compose remains the reproducible local topology. Nginx serves the checked-in `nginx/html` directory and proxies `/api` and `/actuator/health`; it does not build the frontend. Refresh those static assets from `frontend/dist` when updating a local Compose UI. For Vercel, deploy the frontend separately and point it to the Render backend as described above.

## Security considerations

- Authentication and authorization are not implemented; a student ID is not an access credential.
- CORS is not access control.
- Keep database and LLM secrets out of source and browser code; replace the Compose development password before shared deployment.
- Rate limiting is best-effort and uses X-Real-IP when present; configure trusted proxies carefully.
- LLM answers may be inaccurate and should not be treated as authoritative.

## Limitations and future work

Current limitations include demo-only course/quiz/study-hour/streak sections, no authentication, no mentor history UI, and no checked-in Vercel/Render deployment manifests or visible CI workflow. Recommended improvements are secure identity and authorization, mark update/delete, data-backed course and quiz features, automated CI, and a reproducible frontend build/deployment pipeline.

## Screenshots

No screenshots are included in the inspected repository. Add genuine captures under docs/images and link them here.

## Author

Add the author's preferred name and contact details. No author identity is inferred from repository contents.
