"""
auth.py — Supabase Auth + Trip History helpers for Wandrly
"""

import os
import json
from datetime import datetime, timezone

from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(override=True)

_supabase: Client | None = None


def get_client() -> Client | None:
    """Return a cached Supabase client, or None if credentials are missing."""
    global _supabase
    if _supabase is not None:
        return _supabase
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_ANON_KEY", "")
    if not url or not key:
        return None
    _supabase = create_client(url, key)
    return _supabase


# ─────────────────────────────────────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────────────────────────────────────

def sign_up(email: str, password: str) -> dict:
    """Register a new user. Returns {"ok": True, "user": ...} or {"ok": False, "error": ...}."""
    sb = get_client()
    if sb is None:
        return {"ok": False, "error": "Supabase not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to .env"}
    try:
        res = sb.auth.sign_up({"email": email, "password": password})
        if res.user:
            return {"ok": True, "user": res.user, "session": res.session}
        return {"ok": False, "error": "Sign-up failed — check your email/password."}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def sign_in(email: str, password: str) -> dict:
    """Sign in an existing user."""
    sb = get_client()
    if sb is None:
        return {"ok": False, "error": "Supabase not configured."}
    try:
        res = sb.auth.sign_in_with_password({"email": email, "password": password})
        if res.user:
            return {"ok": True, "user": res.user, "session": res.session}
        return {"ok": False, "error": "Invalid email or password."}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def sign_out() -> None:
    """Sign out the current user."""
    sb = get_client()
    if sb:
        try:
            sb.auth.sign_out()
        except Exception:
            pass


# ─────────────────────────────────────────────────────────────────────────────
# TRIP HISTORY
# ─────────────────────────────────────────────────────────────────────────────

def save_trip(user_id: str, trip: dict) -> dict:
    """
    Persist a trip to the `trips` table.
    `trip` must contain at minimum: destination, origin, start_date, end_date,
    itinerary, budget_json, members.
    """
    sb = get_client()
    if sb is None:
        return {"ok": False, "error": "Supabase not configured."}
    try:
        payload = {
            "user_id": user_id,
            "destination": trip.get("destination", ""),
            "origin": trip.get("origin", ""),
            "start_date": trip.get("start_date", ""),
            "end_date": trip.get("end_date", ""),
            "members": trip.get("members", 1),
            "itinerary": trip.get("itinerary", ""),
            "budget_json": json.dumps(trip.get("budget_json")) if trip.get("budget_json") else None,
            "local_tips": trip.get("local_tips", ""),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        res = sb.table("trips").insert(payload).execute()
        return {"ok": True, "data": res.data}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def load_trips(user_id: str) -> list[dict]:
    """Return all saved trips for a user, newest first."""
    sb = get_client()
    if sb is None:
        return []
    try:
        res = (
            sb.table("trips")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return res.data or []
    except Exception:
        return []


def delete_trip(trip_id: int) -> dict:
    """Delete a trip by its primary key id."""
    sb = get_client()
    if sb is None:
        return {"ok": False, "error": "Supabase not configured."}
    try:
        sb.table("trips").delete().eq("id", trip_id).execute()
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}
