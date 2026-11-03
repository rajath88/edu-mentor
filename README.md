# EduMentor: agentic study-progress service

Spring Boot 3 (Java 21), LangChain4j, LangGraph4j, PostgreSQL, Valkey, Docker Compose, Nginx.

## Run
    cp .env.example .env     # add your LLM_API_KEY
    docker compose --env-file .env up --build
    open http://localhost

## Architecture
Client -> Nginx (reverse proxy, static UI) -> Spring Boot -> PostgreSQL / Valkey / LLM API

## Agent graph (LangGraph4j)
analyze (DB + Valkey cache) -> plan (LLM) -> critique (LLM) -> [REVISE -> plan, max 2] -> answer

## Valkey usage
- `analytics` cache (10 min TTL), evicted on new marks/exams
- per-IP rate limiting on `/api/mentor/**`

## API
POST /api/students, POST /api/students/{id}/marks, POST /api/students/{id}/exams,
GET /api/students/{id}/analytics, POST /api/mentor/{id}/ask, GET /api/mentor/{id}/history

## Not yet done (next steps)
JWT auth, tests (Testcontainers), streaming responses, pgvector RAG, CI pipeline.
