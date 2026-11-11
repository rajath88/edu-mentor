# EduMentor Architecture

These diagrams describe checked-in source and configuration. They do not imply a Render or Vercel deployment.

## Overall system

~~~mermaid
flowchart LR
  B[Student browser: React SPA] --> N[Nginx]
  N -->|static files| B
  N -->|/api and health proxy| A[Spring Boot REST API]
  A --> C[ApiController]
  C --> S[Services]
  S --> P[(PostgreSQL)]
  S --> V[(Valkey cache and counters)]
  C --> G[LangGraph4j MentorAgent]
  G --> L[Gemini ChatModel via LangChain4j]
~~~

## Frontend → backend → database flow

~~~mermaid
sequenceDiagram
  participant U as Browser UI
  participant C as ApiController
  participant S as Service
  participant R as Spring Data repository
  participant P as PostgreSQL
  participant V as Valkey
  U->>C: Axios JSON request under /api
  C->>C: Validate request DTO
  C->>S: Delegate operation
  S->>R: Query or save
  R->>P: SQL operation
  P-->>R: Rows
  R-->>C: Entities/result
  C-->>U: JSON response
  S->>V: Analytics cache lookup/write, 10-minute TTL
~~~

## AI Mentor workflow

~~~mermaid
flowchart TD
  Q[POST mentor ask] --> R{Valkey IP rate limit}
  R -->|over limit| X[429 response]
  R -->|allowed or Valkey failure| A[Analyze student analytics]
  A --> P[Plan answer from question and context]
  P --> C[Critique answer]
  C -->|revision requested within bound| P
  C -->|accepted or limit reached| S[Save question and answer]
  S --> O[Return answer JSON]
~~~

Mentor state contains student ID, question, analytics JSON, candidate response, critique, and iteration count. AiConfig reads the server-side `LLM_API_KEY`, `LLM_MODEL` (default `gemini-3.5-flash-lite`), and optional `LLM_BASE_URL`; temperature is 0.4 and timeout is 60 seconds. Rate limit is 10 requests/minute per selected client IP and fails open on Valkey data-access errors.

## Deployment architecture in Compose

~~~mermaid
flowchart LR
  W[Browser] -->|port 80| N[Nginx 1.27-alpine]
  N -->|checked-in nginx/html| W
  N -->|API and health proxy| A[Java 21 app]
  A -->|JDBC| P[(PostgreSQL 16)]
  A -->|Redis protocol| V[(Valkey 8)]
  A -->|HTTPS model request| G[Gemini API]
  P --- D[(pgdata volume)]
~~~

Compose publishes Nginx on port 80 and app on `127.0.0.1:8080`. Spring resolves its port as `PORT`, then `SERVER_PORT`, then 8080. PostgreSQL has a healthcheck and persistent pgdata volume. Valkey is capped at 128 MB with allkeys-lru. Dockerfile builds only the backend; Nginx mounts checked-in frontend files rather than building frontend source. No Render, Vercel, or CI workflow configuration was found.

## Database design

~~~mermaid
erDiagram
  STUDENTS ||--o{ MARKS : records
  STUDENTS ||--o{ EXAMS : schedules
  STUDENTS ||--o{ MENTOR_MESSAGES : exchanges
  STUDENTS { bigint id PK
    varchar name
    varchar email UK }
  MARKS { bigint id PK
    bigint student_id FK
    varchar subject
    varchar topic
    numeric score
    numeric max_score
    date taken_on }
  EXAMS { bigint id PK
    bigint student_id FK
    varchar subject
    date exam_date }
  MENTOR_MESSAGES { bigint id PK
    bigint student_id FK
    varchar role
    text content
    timestamp created_at }
~~~

Flyway V1 creates the four tables. Child foreign keys cascade on student deletion. Index: marks(student_id, taken_on). JPA uses ddl-auto validate.

## Operational configuration findings

- Hikari maximum pool size 5, minimum idle 0, connection timeout 10 seconds.
- Spring Cache uses Valkey with ten-minute TTL; mark/exam writes evict the relevant analytics key.
- Actuator exposes health only and enables probes.
- Frontend reads `VITE_API_BASE_URL`; development defaults to `http://localhost:8080/api`, while production defaults to same-origin `/api`. A separately hosted Vercel frontend must set the Render API URL at build time.
- Compose passes Gemini model, API key, and optional base URL to the active Gemini ChatModel configuration. Alternative provider variables are not used by that bean.
- CORS origin patterns are configurable with `CORS_ALLOWED_ORIGINS`; defaults allow local development and `https://*.vercel.app`. The API allows GET, POST, DELETE, and OPTIONS. CORS does not authenticate users.
