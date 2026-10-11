import json
import os
import re
from typing import Literal

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="TouchGrass AI API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")

Interest = Literal["walking", "gardening", "birdwatching", "photography", "mindfulness", "exploring"]
Energy = Literal["low", "medium", "high"]


class MissionRequest(BaseModel):
    minutes: int = Field(default=20, ge=5, le=180)
    interest: Interest = "walking"
    energy: Energy = "medium"


class Mission(BaseModel):
    title: str
    description: str
    steps: list[str]
    duration_minutes: int
    interest: str
    safety_note: str
    source: Literal["local-ai", "offline-template"]


TEMPLATES = {
    "walking": ("Notice-and-Walk", "Take an easy walk and pay attention to details you usually pass by.",
                ["Choose a familiar, safe route.", "Notice five different shapes, textures, or colors.", "Pause somewhere safe and name one thing you enjoyed."]),
    "gardening": ("Tiny Garden Task", "Spend a little time caring for a plant or learning about a green space.",
                  ["Check a plant or garden bed.", "Remove only obvious weeds you can identify safely, or water if needed.", "Notice one change you might make next time."]),
    "birdwatching": ("Three-Minute Bird Watch", "Observe birds from a respectful distance without disturbing them.",
                     ["Find a safe place to stand or sit.", "Watch quietly and note colors, calls, or movement.", "If you cannot see a bird, record other signs of nature instead."]),
    "photography": ("Five Nature Details", "Make a tiny photo walk focused on details rather than distance.",
                    ["Choose a safe route or outdoor spot.", "Photograph up to five natural patterns, leaves, shadows, or textures.", "Pick a favorite and write one sentence about it."]),
    "mindfulness": ("Outdoor Senses Reset", "Take a gentle pause outdoors and reconnect with your surroundings.",
                    ["Sit or stand somewhere safe.", "Notice three things you see, two sounds, and one sensation such as a breeze.", "Take a few comfortable breaths and return when ready."]),
    "exploring": ("Micro-Explorer", "Explore one nearby public outdoor space with curiosity.",
                 ["Pick a familiar, public area.", "Find one feature you have not noticed before.", "Return by a known route and note what surprised you."]),
}


def fallback_mission(req: MissionRequest) -> Mission:
    title, description, steps = TEMPLATES[req.interest]
    if req.minutes <= 10:
        steps = steps[:2] + ["Finish by noting one thing you noticed."]
    elif req.minutes >= 30:
        steps = steps + ["If you still have time, repeat slowly or explore another nearby section."]
    if req.energy == "low":
        description += " Keep the pace gentle and feel free to sit or shorten the activity."
    return Mission(
        title=title.replace("-", " "),
        description=description,
        steps=steps,
        duration_minutes=req.minutes,
        interest=req.interest,
        safety_note="Choose a safe, accessible place, respect wildlife and private property, and follow local conditions.",
        source="offline-template",
    )


def parse_json_response(raw: str) -> dict:
    # Handle models that wrap JSON in markdown fences or add brief surrounding text.
    raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.IGNORECASE)
    start, end = raw.find("{"), raw.rfind("}")
    if start < 0 or end <= start:
        raise ValueError("No JSON object returned")
    return json.loads(raw[start:end + 1])



@app.get("/api/health")
async def health():
    tags_url = OLLAMA_URL.rsplit("/", 1)[0] + "/tags"
    ollama_available = False

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(tags_url)
            response.raise_for_status()
            ollama_available = True
    except httpx.HTTPError:
        pass

    return {
        "status": "ok",
        "model": OLLAMA_MODEL,
        "ollama_configured": bool(OLLAMA_URL and OLLAMA_MODEL),
        "ollama_available": ollama_available,
    }



@app.post("/api/missions", response_model=Mission)
async def create_mission(req: MissionRequest):
    fallback = fallback_mission(req)
    prompt = f"""
Create one safe, realistic outdoor mission. Return ONLY valid JSON with keys:
title (string), description (string), steps (array of 2 to 4 short strings),
duration_minutes (integer), interest (string), safety_note (string).
Interest: {req.interest}
Available time: {req.minutes} minutes
Energy: {req.energy}
Rules: activity must happen outdoors; do not require purchases, special equipment, internet,
or entering private property. Do not claim to identify species. Be inclusive of mobility needs.
Use a calm, encouraging tone. Keep duration_minutes exactly {req.minutes}.
"""
    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            response = await client.post(
                OLLAMA_URL,
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                    "options": {"temperature": 0.7, "num_predict": 220, "seed": 42},
                },
            )
            response.raise_for_status()
            raw = response.json().get("response", "")
        data = parse_json_response(raw)
        steps = data.get("steps")
        if not isinstance(steps, list) or not 2 <= len(steps) <= 4:
            raise ValueError("Invalid steps")
        return Mission(
            title=str(data.get("title", fallback.title))[:80],
            description=str(data.get("description", fallback.description))[:400],
            steps=[str(s)[:180] for s in steps],
            duration_minutes=req.minutes,
            interest=req.interest,
            safety_note=str(data.get("safety_note", fallback.safety_note))[:300],
            source="local-ai",
        )
    except (httpx.HTTPError, ValueError, json.JSONDecodeError, KeyError, TypeError):
        return fallback
