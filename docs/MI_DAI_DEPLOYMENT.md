Mi dAI — Deployment Guide

Overview
- New route: `/dashboard/mi-dai` (UI)
- API routes: `/api/mi-dai/context`, `/api/mi-dai/plan`, `/api/mi-dai/insights`, `/api/mi-dai/prep`
- Optional microservice: `ai_service/` (FastAPI) for optimizer/ML/vector memory

Env Vars
- `NEXT_PUBLIC_AI_ENABLED=true` to show IA status as ON
- `CLAUDE_API_KEY` (optional): enables server AI via Claude in plan/prep services
- `GOOGLE_*` creds as already configured (Calendar/Gmail/Drive)
- `MIDAI_SERVICE_URL` (optional): base URL of the microservice (e.g., http://localhost:8081)
- `MIDAI_USE_OPTIMIZER=true` (optional): route plan generation through the microservice `/optimize-plan`

Local Dev
1) Next.js app: `npm run dev`
2) Optional microservice:
   - `cd ai_service && python -m venv .venv && source .venv/bin/activate`
   - `pip install -r requirements.txt`
   - `uvicorn main:app --port 8081 --reload`

What’s wired now
- UI for Mi dAI with Generate Plan, Insights, and Pending Tasks
- Context route pulls from Google Calendar/Gmail/Drive (as available) and Firestore tasks
- Plan route uses existing AI plan-service (Claude if key present, else heuristic fallback)
- Insights route returns quick, rule-based insights (can be replaced by LLM)
- Prep route delegates to existing AI prep-service

Next Steps
- Point plan/insights/prep to the microservice (replace internal services or use feature flag)
- Implement real OR-Tools optimizer inside `ai_service` (now you can enable with `MIDAI_USE_OPTIMIZER=true`)
- Add River model for `meeting-prep` and persist online learning
- Connect Qdrant/pgvector for `/mem/*` endpoints and enrich Mi dAI context (basic stubs are wired)
