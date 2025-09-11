Mi dAI Microservice (FastAPI)

This optional microservice hosts advanced optimization (OR-Tools),
online learning (River/scikit-learn) and vector memory (Qdrant/pgvector).
The Next.js app calls it via the /api/mi-dai/* routes when enabled.

Quick start
- python -m venv .venv && source .venv/bin/activate
- pip install -r requirements.txt
- uvicorn main:app --port 8081 --reload

Endpoints
- POST /optimize-plan: Returns an optimized plan given a ContextPack
- POST /predict/meeting-prep: Predicts if a meeting needs prep
- POST /mem/upsert, /mem/search: Vector memory stub

Environment
- MIDAI_VECTOR_URL (optional)
- MIDAI_MODEL_PATH (optional)

