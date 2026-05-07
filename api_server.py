import asyncio
import json
import os
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

load_dotenv(override=True)

app = FastAPI(title="Wandrly API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

executor = ThreadPoolExecutor(max_workers=8)


# ── Request Models ──────────────────────────────────────────────────────────

class PlanTripRequest(BaseModel):
    origin: str
    destination: str
    start_date: str
    end_date: str
    no_of_members: int
    interests: str
    trip_vibe: str
    only_veg: bool = False
    religious: bool = False


class SuggestRequest(BaseModel):
    origin: str
    budget: str
    weather: str
    month: str


class PackingRequest(BaseModel):
    destination: str
    no_of_days: int
    trip_vibe: str
    interests: str


class ChatRequest(BaseModel):
    itinerary: str
    chat_history: str
    query: str


class LocalTipsRequest(BaseModel):
    destination: str


# ── Helpers ─────────────────────────────────────────────────────────────────

def _sse(event: str, data: dict) -> str:
    payload = json.dumps({"event": event, **data})
    return f"data: {payload}\n\n"


def _days_between(start: str, end: str) -> int:
    fmt = "%Y-%m-%d"
    try:
        return (datetime.strptime(end, fmt) - datetime.strptime(start, fmt)).days
    except Exception:
        return 7


# ── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/api/india-destinations")
async def india_destinations():
    path = os.path.join(os.path.dirname(__file__), "assets", "discover_india.json")
    with open(path) as f:
        return json.load(f)


@app.post("/api/suggest")
async def suggest(req: SuggestRequest):
    loop = asyncio.get_event_loop()
    from agents import suggester_agent
    result = await loop.run_in_executor(
        executor, suggester_agent, req.origin, req.budget, req.weather, req.month
    )
    return {"result": result}


@app.post("/api/packing-list")
async def packing_list(req: PackingRequest):
    loop = asyncio.get_event_loop()
    from agents import packing_agent
    result = await loop.run_in_executor(
        executor, packing_agent,
        req.destination, req.no_of_days, req.trip_vibe, req.interests
    )
    try:
        return {"result": json.loads(result)}
    except Exception:
        return {"result": {}, "error": "parse_error"}


@app.post("/api/chat")
async def chat(req: ChatRequest):
    loop = asyncio.get_event_loop()
    from agents import chat_agent
    result = await loop.run_in_executor(
        executor, chat_agent,
        req.itinerary, req.chat_history, req.query
    )
    return {"result": result}


@app.post("/api/local-tips")
async def local_tips(req: LocalTipsRequest):
    loop = asyncio.get_event_loop()
    from agents import local_tips_agent
    result = await loop.run_in_executor(executor, local_tips_agent, req.destination)
    return {"result": result}


@app.post("/api/plan-trip")
async def plan_trip(req: PlanTripRequest):
    loop = asyncio.get_event_loop()

    async def generate():
        try:
            from agents import (
                planner_agent, research_agent, summary_agent, booking_agent,
                fetch_events, fetch_images, get_coordinates, budget_agent,
                fetch_and_scrape_blogs, build_vector_db, local_tips_agent,
            )

            yield _sse("progress", {"step": 0, "pct": 3, "label": "Warming up the engines…"})

            images = await loop.run_in_executor(executor, fetch_images, req.destination)
            yield _sse("images", {"images": images})

            yield _sse("progress", {"step": 1, "pct": 12, "label": "Planning your trip…"})
            task_list = await loop.run_in_executor(
                executor, planner_agent,
                req.origin, req.destination, req.start_date, req.end_date,
                req.no_of_members, req.interests,
            )

            yield _sse("progress", {"step": 2, "pct": 24, "label": "Fetching live flights & hotels…"})
            booking_data = await loop.run_in_executor(
                executor, booking_agent,
                req.origin, req.destination, req.start_date, req.end_date, req.no_of_members,
            )

            yield _sse("progress", {"step": 3, "pct": 35, "label": "Crunching the budget numbers…"})
            no_of_days = _days_between(req.start_date, req.end_date)
            budget_raw = await loop.run_in_executor(
                executor, budget_agent,
                booking_data, no_of_days, req.no_of_members, req.destination,
            )
            try:
                budget_json = json.loads(budget_raw)
            except Exception:
                budget_json = None
            yield _sse("budget", {"budget": budget_json})

            yield _sse("progress", {"step": 4, "pct": 46, "label": "Finding events at your destination…"})
            event_data = await loop.run_in_executor(
                executor, fetch_events, req.destination, req.start_date, req.end_date,
            )

            yield _sse("progress", {"step": 5, "pct": 57, "label": "Scraping travel blogs for hidden gems…"})
            scraped_text = await loop.run_in_executor(
                executor, fetch_and_scrape_blogs, req.destination,
            )

            yield _sse("progress", {"step": 6, "pct": 65, "label": "Building knowledge base…"})
            vector_db = await loop.run_in_executor(executor, build_vector_db, scraped_text)

            yield _sse("progress", {"step": 7, "pct": 76, "label": "Researching your destination in depth…"})
            research_data = await loop.run_in_executor(
                executor, research_agent, task_list, req.destination, vector_db,
            )

            yield _sse("progress", {"step": 8, "pct": 87, "label": "Crafting your perfect itinerary…"})
            final_itinerary = await loop.run_in_executor(
                executor, summary_agent,
                research_data, booking_data, event_data,
                req.start_date, req.end_date, req.destination,
            )

            yield _sse("progress", {"step": 9, "pct": 94, "label": "Loading local insider tips…"})
            tips = await loop.run_in_executor(executor, local_tips_agent, req.destination)

            yield _sse("progress", {"step": 10, "pct": 98, "label": "Pinning your destination on the map…"})
            coords = await loop.run_in_executor(executor, get_coordinates, req.destination)

            yield _sse("done", {
                "itinerary": final_itinerary,
                "events": event_data,
                "local_tips": tips,
                "coords": coords,
                "no_of_days": no_of_days,
            })

        except Exception as e:
            yield _sse("error", {"message": str(e)})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
