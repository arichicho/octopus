from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timezone
from ortools.sat.python import cp_model
import math

app = FastAPI(title="Mi dAI Service", version="0.1.0")


class WorkingHours(BaseModel):
    start: str
    end: str


class Settings(BaseModel):
    timezone: str
    workingHours: WorkingHours
    buffers: Dict[str, int] = {"prepMinutes": 10, "postMinutes": 5}
    blocks: Dict[str, int] = {"minBlockMinutes": 10, "slotGranularityMinutes": 5}
    quickWins: Dict[str, int] = {"maxMinutes": 15}
    deepWork: Dict[str, int] = {"minMinutes": 60, "maxPerDayMinutes": 180}
    plan: Dict[str, Any] = {"maxBlocks": 20, "maxFocusBlocks": 3}
    scoring: Dict[str, Any] = {"weights": {}}


class Event(BaseModel):
    id: str
    title: str
    start: str
    end: str
    allDay: Optional[bool] = False


class Task(BaseModel):
    id: str
    title: str
    priority: str = "M"
    estimateMinutes: Optional[int] = None
    dueDate: Optional[str] = None
    status: Optional[str] = "open"


class Context(BaseModel):
    dateISO: str
    settings: Settings
    events: List[Event] = []
    tasks: List[Task] = []
    emailThreads: List[dict] = []
    docs: List[dict] = []
    peopleIndex: Dict[str, Any] = {}


@app.get("/health")
def health():
    return {"ok": True, "ts": datetime.utcnow().isoformat()}


def iso_to_dt(s: str) -> datetime:
    try:
        return datetime.fromisoformat(s.replace('Z', '+00:00'))
    except Exception:
        return datetime.strptime(s[:19], '%Y-%m-%dT%H:%M:%S').replace(tzinfo=timezone.utc)


def as_minutes(day: str, dt: datetime) -> int:
    base = datetime.fromisoformat(f"{day}T00:00:00+00:00")
    return max(0, int((dt - base).total_seconds() // 60))


def clamp(v: int, lo: int, hi: int) -> int:
    return max(lo, min(hi, v))


def score_task(t: Task, day: str) -> int:
    s = 0
    if t.priority == 'H':
        s += 50
    if t.dueDate:
        try:
            due = datetime.fromisoformat(f"{t.dueDate}T00:00:00+00:00")
            today = datetime.fromisoformat(f"{day}T00:00:00+00:00")
            diff = int((due - today).days)
            if diff <= 0:
                s += 40
            elif diff == 1:
                s += 25
            elif diff <= 3:
                s += 10
        except Exception:
            pass
    est = t.estimateMinutes or 30
    if est <= 15:
        s += 5
    return s


@app.post("/optimize-plan")
def optimize(ctx: Context):
    # 0) Setup day window and meetings
    day = ctx.dateISO[:10]
    ws = ctx.settings.workingHours.start
    we = ctx.settings.workingHours.end
    wsh, wsm = map(int, ws.split(':'))
    weh, wem = map(int, we.split(':'))
    day_start = wsh * 60 + wsm
    day_end = weh * 60 + wem
    gran = max(5, int(ctx.settings.blocks.get('slotGranularityMinutes', 5)))
    prep_buf = int(ctx.settings.buffers.get('prepMinutes', 10))
    post_buf = int(ctx.settings.buffers.get('postMinutes', 5))

    blocks: List[Dict[str, Any]] = []
    occupied: List[Tuple[int, int]] = []

    for e in ctx.events:
      if e.allDay:
        continue
      s = as_minutes(day, iso_to_dt(e.start))
      e_ = as_minutes(day, iso_to_dt(e.end))
      s = clamp(s, day_start, day_end)
      e_ = clamp(e_, day_start, day_end)
      if e_ <= s:
        continue
      # Meeting block
      blocks.append({
          "id": f"meeting-{e.id}",
          "type": "meeting",
          "status": "fixed",
          "start": iso_to_dt(e.start).isoformat(),
          "end": iso_to_dt(e.end).isoformat(),
          "title": e.title,
          "reason": "Reunión del calendario",
          "confidence": 1.0,
          "relations": {"meetingId": e.id}
      })
      # Occupied with buffers
      occ_s = max(day_start, s - prep_buf)
      occ_e = min(day_end, e_ + post_buf)
      occupied.append((occ_s, occ_e))

    occupied.sort(key=lambda x: x[0])

    # 1) Select candidate tasks by score
    tasks = list(ctx.tasks)
    tasks.sort(key=lambda t: score_task(t, day), reverse=True)
    max_blocks = int(ctx.settings.plan.get('maxBlocks', 20))
    candidates = tasks[: max(0, max_blocks - len(blocks)) + 10]

    # 2) Build CP-SAT model
    model = cp_model.CpModel()
    intervals = []
    presences = []
    starts = {}
    durations = {}
    ends = {}

    # Fixed meeting intervals to block time
    for i, (s, e_) in enumerate(occupied):
        # Represent as fixed intervals; we'll put them in the no-overlap resource too
        fi = model.NewFixedInterval(s, e_ - s, f"fixed_{i}")
        intervals.append(fi)

    # Create optional intervals for tasks
    for t in candidates:
        dur = max(gran, int((t.estimateMinutes or 30) // gran * gran))
        dur = max(gran, dur)
        slot_var = model.NewIntVar(0, max(0, (day_end - day_start) // gran), f"slot_{t.id}")
        start = model.NewIntVar(day_start, day_end, f"start_{t.id}")
        end = model.NewIntVar(day_start, day_end, f"end_{t.id}")
        presence = model.NewBoolVar(f"x_{t.id}")
        # Quantize: start = day_start + slot*gran
        model.Add(start == day_start + slot_var * gran).OnlyEnforceIf(presence)
        model.Add(end == start + dur).OnlyEnforceIf(presence)
        # Fit within day
        model.Add(end <= day_end).OnlyEnforceIf(presence)
        # Optional interval
        itv = model.NewOptionalIntervalVar(start, dur, end, presence, f"itv_{t.id}")
        intervals.append(itv)
        presences.append((presence, score_task(t, day), t, start, dur, end))
        starts[t.id] = start
        durations[t.id] = dur
        ends[t.id] = end

    # No-overlap over meetings and optional task intervals
    model.AddNoOverlap(intervals)

    # Objective: maximize weighted scheduled tasks; prefer earlier starts
    #  weight = score*1000 - start
    objective_terms = []
    for presence, sc, t, start, dur, end in presences:
        # to bias earlier scheduling we subtract small factor times start
        # need linearization: maximize sc*presence - 0.001*start*presence -> scale
        objective_terms.append((sc * 1000, presence))
        # add negative small coefficient for start
        # create an auxiliary int var: start_scaled = start // gran
        start_scaled = model.NewIntVar(0, max(1, (day_end - day_start) // gran), f"startScaled_{t.id}")
        model.AddDivisionEquality(start_scaled, start - day_start, gran).OnlyEnforceIf(presence)
        # presence * start_scaled needs linearization:
        prod = model.NewIntVar(0, (day_end - day_start) // gran, f"pStart_{t.id}")
        model.Add(prod == start_scaled).OnlyEnforceIf(presence)
        model.Add(prod == 0).OnlyEnforceIf(presence.Not())
        # subtract small weight (1) for later starts
        objective_terms.append((-1, prod))

    # Limit total number of scheduled task blocks if needed
    if max_blocks > 0 and presences:
        model.Add(sum(p for p, *_ in presences) <= max_blocks)

    # Limit number of focus blocks using duration threshold ≥ 61
    focus_candidates = [p for (p, sc, t, start, dur, end) in presences if int(dur) >= 61]
    try:
        max_focus = int(ctx.settings.plan.get('maxFocusBlocks', 3))
    except Exception:
        max_focus = 3
    if focus_candidates and max_focus >= 0:
        model.Add(sum(focus_candidates) <= max_focus)

    # Penalize fragmentation stronger: prefer fewer task blocks
    for presence, *_ in presences:
        objective_terms.append((-12, presence))
    # Build linear maximization: sum(coeff * var)
    model.Maximize(sum(coeff * var for coeff, var in objective_terms))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 2.0
    solver.parameters.num_search_workers = 8
    res = solver.Solve(model)

    # 3) Build output blocks for scheduled tasks
    from datetime import timedelta
    def minutes_to_iso(m: int) -> str:
        base = datetime.fromisoformat(f"{day}T00:00:00+00:00")
        return (base + timedelta(minutes=int(m))).isoformat()

    for presence, sc, t, start, dur, end in presences:
        if solver.BooleanValue(presence):
            smin = solver.Value(start)
            emin = smin + int(dur)
            # Classify by duration thresholds
            est = int(dur)
            qmax = ctx.settings.quickWins.get("maxMinutes", 15)
            if est <= qmax:
                btype = "quickwin"
            elif est >= 61:
                btype = "focus"
            else:
                btype = "followup"
            blocks.append({
                "id": f"task-{t.id}",
                "type": btype,
                "status": "suggested",
                "start": minutes_to_iso(smin),
                "end": minutes_to_iso(emin),
                "title": t.title,
                "reason": "Programado por optimizador",
                "confidence": 0.8,
                "relations": {"taskId": t.id}
            })

    plan = {
        "date": day,
        "summary": {
            "meetingsCount": len([b for b in blocks if b["type"] == "meeting"]),
            "freeMinutes": max(0, (day_end - day_start) - sum(max(0, e - s) for s, e in occupied)),
            "criticalCount": len([t for t in ctx.tasks if t.priority == "H"]),
            "notes": "Plan optimizado (OR-Tools)"
        },
        "blocks": sorted(blocks, key=lambda b: b["start"]),
        "followUps": [],
        "warnings": [],
    }
    return plan


@app.post("/predict/meeting-prep")
def predict_prep(payload: dict):
    title = payload.get("title", "").lower()
    needs = any(k in title for k in ["estrategia", "comercial", "presupuesto", "cierre", "board"])
    return {"needsPrep": needs, "confidence": 0.6}


# --- Simple in-memory TF-IDF memory (fallback) ---
_MEM_STORE: List[Dict[str, Any]] = []
_VECTORIZER = None
_MATRIX = None


@app.post("/mem/upsert")
def mem_upsert(payload: dict):
    from sklearn.feature_extraction.text import TfidfVectorizer
    global _MEM_STORE, _VECTORIZER, _MATRIX
    items = payload.get("items", [])
    # Upsert by id
    existing = {it["id"]: i for i, it in enumerate(_MEM_STORE)}
    for it in items:
        if it["id"] in existing:
            _MEM_STORE[existing[it["id"]]] = it
        else:
            _MEM_STORE.append(it)
    # Rebuild vectorizer (simple approach)
    texts = [it.get("text", "") for it in _MEM_STORE]
    if texts:
        _VECTORIZER = TfidfVectorizer(stop_words='spanish')
        _MATRIX = _VECTORIZER.fit_transform(texts)
    return {"ok": True, "upserted": len(items)}


@app.post("/mem/search")
def mem_search(payload: dict):
    from sklearn.metrics.pairwise import cosine_similarity
    global _MEM_STORE, _VECTORIZER, _MATRIX
    q = payload.get("query", "")
    topk = int(payload.get("topK", 5))
    if not _VECTORIZER or _MATRIX is None or not q:
        return {"results": []}
    qvec = _VECTORIZER.transform([q])
    sims = cosine_similarity(qvec, _MATRIX)[0]
    idxs = sims.argsort()[::-1][:topk]
    results = []
    for idx in idxs:
        results.append({"id": _MEM_STORE[idx]["id"], "score": float(sims[idx]), "metadata": _MEM_STORE[idx]})
    return {"results": results}
