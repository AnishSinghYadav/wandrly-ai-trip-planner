import streamlit as st
import requests
from streamlit_lottie import st_lottie
from dotenv import load_dotenv
import os
import json
import urllib.parse
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import folium
from streamlit_folium import st_folium
from datetime import date, timedelta, datetime
from ics import Calendar, Event
from markdown_pdf import MarkdownPdf, Section
from agents import (
    planner_agent, research_agent, summary_agent, booking_agent,
    fetch_events, fetch_images, get_coordinates, budget_agent, chat_agent,
    suggester_agent, fetch_and_scrape_blogs, build_vector_db,
    packing_agent, local_tips_agent, fetch_live_flights
)
import auth as wb_auth
import re as _re

load_dotenv(override=True)

def _to_int(val):
    """Convert a budget value to int robustly — handles '50000', 4760, 'min(...)=4760 * 2', etc."""
    try:
        return int(val)
    except (TypeError, ValueError):
        nums = _re.findall(r'\d+', str(val))
        return int(nums[-1]) if nums else 0

st.set_page_config(
    page_title="Wandrly — AI Trip Planner",
    page_icon="🌍",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ─────────────────────────────────────────────────────────────────────────────
# GLOBAL CSS — Wandrly design system
# ─────────────────────────────────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@400;600;700;800;900&display=swap');

*, *::before, *::after { box-sizing: border-box; }

html, body, [class*="css"] {
    font-family: 'Inter', sans-serif;
}

/* ── SCROLLBAR ── */
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: #0f172a; }
::-webkit-scrollbar-thumb { background: linear-gradient(#4ecdc4, #a855f7); border-radius: 3px; }

/* ── APP BACKGROUND ── */
.stApp {
    background: radial-gradient(ellipse at 20% 20%, rgba(78,205,196,0.04) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 80%, rgba(168,85,247,0.04) 0%, transparent 50%),
                linear-gradient(180deg, #080d1a 0%, #0a0f1e 100%);
}

/* ── SIDEBAR ── */
[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #0c1428 0%, #0f172a 100%) !important;
    border-right: 1px solid rgba(78, 205, 196, 0.15) !important;
}
[data-testid="stSidebar"] > div:first-child {
    padding-top: 1rem;
}

/* ── SIDEBAR TOP ACCENT LINE ── */
section[data-testid="stSidebar"]::before {
    content: '';
    display: block;
    height: 3px;
    background: linear-gradient(90deg, #4ecdc4, #a855f7, #ec4899);
    margin-bottom: 8px;
}

/* ── BUTTONS ── */
.stButton > button {
    background: linear-gradient(135deg, #4ecdc4 0%, #a855f7 100%) !important;
    color: #080d1a !important;
    border: none !important;
    border-radius: 14px !important;
    padding: 0.7rem 1.5rem !important;
    font-weight: 800 !important;
    font-size: 0.95rem !important;
    letter-spacing: 0.4px !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    box-shadow: 0 4px 24px rgba(78, 205, 196, 0.35) !important;
    width: 100% !important;
}
.stButton > button:hover {
    transform: translateY(-3px) scale(1.01) !important;
    box-shadow: 0 10px 40px rgba(78, 205, 196, 0.5) !important;
}
.stButton > button:active {
    transform: translateY(0) !important;
}

/* ── DOWNLOAD BUTTONS ── */
.stDownloadButton > button {
    background: rgba(255,255,255,0.05) !important;
    color: #4ecdc4 !important;
    border: 1px solid rgba(78, 205, 196, 0.3) !important;
    border-radius: 12px !important;
    font-weight: 600 !important;
    transition: all 0.2s ease !important;
    width: 100% !important;
}
.stDownloadButton > button:hover {
    background: rgba(78, 205, 196, 0.12) !important;
    border-color: #4ecdc4 !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 20px rgba(78, 205, 196, 0.25) !important;
}

/* ── TEXT INPUTS ── */
.stTextInput > div > div > input,
.stTextArea > div > div > textarea,
.stNumberInput > div > div > input {
    background: rgba(255,255,255,0.04) !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
    border-radius: 12px !important;
    color: #f8fafc !important;
    font-size: 0.9rem !important;
    transition: all 0.2s ease !important;
    padding: 0.6rem 0.9rem !important;
}
.stTextInput > div > div > input:focus,
.stTextArea > div > div > textarea:focus {
    border-color: #4ecdc4 !important;
    box-shadow: 0 0 0 3px rgba(78, 205, 196, 0.12) !important;
}

/* ── LABELS ── */
.stTextInput label, .stTextArea label, .stNumberInput label,
.stSelectbox label, .stDateInput label, .stCheckbox label {
    color: #94a3b8 !important;
    font-size: 0.8rem !important;
    font-weight: 600 !important;
    letter-spacing: 0.5px !important;
    text-transform: uppercase !important;
}

/* ── SELECTBOX ── */
.stSelectbox > div > div {
    background: rgba(255,255,255,0.04) !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
    border-radius: 12px !important;
}

/* ── DATE INPUT ── */
.stDateInput > div > div > input {
    background: rgba(255,255,255,0.04) !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
    border-radius: 12px !important;
    color: #f8fafc !important;
}

/* ── CHECKBOXES ── */
.stCheckbox > label > div:first-child {
    border-color: rgba(78, 205, 196, 0.4) !important;
    border-radius: 6px !important;
}

/* ── RADIO ── */
.stRadio > div {
    gap: 8px !important;
}

/* ── TABS ── */
.stTabs [data-baseweb="tab-list"] {
    background: rgba(255,255,255,0.03) !important;
    border-radius: 16px !important;
    padding: 5px !important;
    border: 1px solid rgba(255,255,255,0.07) !important;
    gap: 4px !important;
    flex-wrap: wrap !important;
}
.stTabs [data-baseweb="tab"] {
    background: transparent !important;
    border-radius: 12px !important;
    color: #64748b !important;
    font-weight: 600 !important;
    font-size: 0.9rem !important;
    transition: all 0.2s ease !important;
    border: none !important;
    padding: 0.5rem 1rem !important;
}
.stTabs [aria-selected="true"] {
    background: linear-gradient(135deg, rgba(78,205,196,0.18), rgba(168,85,247,0.18)) !important;
    color: #f8fafc !important;
    border: 1px solid rgba(78, 205, 196, 0.35) !important;
}

/* ── METRICS ── */
[data-testid="stMetricValue"] {
    font-size: 1.7rem !important;
    font-weight: 900 !important;
    color: #4ecdc4 !important;
    font-family: 'Poppins', sans-serif !important;
}
[data-testid="stMetricLabel"] {
    font-size: 0.72rem !important;
    color: #64748b !important;
    font-weight: 600 !important;
    letter-spacing: 0.7px !important;
    text-transform: uppercase !important;
}
[data-testid="stMetricContainer"] {
    background: rgba(255,255,255,0.03) !important;
    border: 1px solid rgba(255,255,255,0.08) !important;
    border-radius: 16px !important;
    padding: 1rem 1.25rem !important;
    transition: all 0.2s ease !important;
}
[data-testid="stMetricContainer"]:hover {
    border-color: rgba(78, 205, 196, 0.25) !important;
    box-shadow: 0 4px 20px rgba(78, 205, 196, 0.08) !important;
}

/* ── ALERTS ── */
.stSuccess > div {
    background: rgba(34, 197, 94, 0.08) !important;
    border-left: 4px solid #22c55e !important;
    border-radius: 12px !important;
    color: #86efac !important;
}
.stError > div {
    background: rgba(239, 68, 68, 0.08) !important;
    border-left: 4px solid #ef4444 !important;
    border-radius: 12px !important;
    color: #fca5a5 !important;
}
.stWarning > div {
    background: rgba(234, 179, 8, 0.08) !important;
    border-left: 4px solid #eab308 !important;
    border-radius: 12px !important;
    color: #fde68a !important;
}
.stInfo > div {
    background: rgba(78, 205, 196, 0.08) !important;
    border-left: 4px solid #4ecdc4 !important;
    border-radius: 12px !important;
    color: #99f6e4 !important;
}

/* ── CHAT ── */
[data-testid="stChatMessage"] {
    background: rgba(255,255,255,0.03) !important;
    border: 1px solid rgba(255,255,255,0.07) !important;
    border-radius: 18px !important;
    padding: 1rem 1.25rem !important;
    margin-bottom: 0.75rem !important;
}
[data-testid="stChatInputTextArea"] {
    background: rgba(255,255,255,0.05) !important;
    border: 1px solid rgba(78, 205, 196, 0.25) !important;
    border-radius: 16px !important;
    color: #f8fafc !important;
}

/* ── STATUS WIDGET ── */
[data-testid="stStatusWidget"] {
    background: rgba(255,255,255,0.03) !important;
    border: 1px solid rgba(78, 205, 196, 0.2) !important;
    border-radius: 14px !important;
    margin-bottom: 0.5rem !important;
}

/* ── EXPANDERS ── */
details > summary {
    background: rgba(255,255,255,0.04) !important;
    border-radius: 12px !important;
    border: 1px solid rgba(255,255,255,0.08) !important;
    padding: 0.75rem 1rem !important;
    transition: all 0.2s ease !important;
    cursor: pointer !important;
}
details > summary:hover {
    border-color: rgba(78, 205, 196, 0.3) !important;
}

/* ── DIVIDERS ── */
hr {
    border: none !important;
    border-top: 1px solid rgba(255,255,255,0.07) !important;
    margin: 1.5rem 0 !important;
}

/* ── CUSTOM COMPONENT CLASSES ── */
.wand-hero-title {
    font-family: 'Poppins', sans-serif;
    font-size: clamp(2.5rem, 5vw, 4.2rem);
    font-weight: 900;
    line-height: 1.05;
    background: linear-gradient(135deg, #4ecdc4 0%, #a855f7 55%, #ec4899 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
    letter-spacing: -1px;
}

.wand-tagline {
    font-size: 1.1rem;
    color: #64748b;
    margin-top: 0.5rem;
    font-weight: 400;
    letter-spacing: 0.3px;
}

.stat-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 50px;
    padding: 5px 14px;
    font-size: 0.78rem;
    font-weight: 600;
    color: #94a3b8;
    margin-right: 8px;
    margin-top: 8px;
    display: inline-flex;
}
.stat-pill.teal { border-color: rgba(78,205,196,0.3); color: #4ecdc4; background: rgba(78,205,196,0.07); }
.stat-pill.purple { border-color: rgba(168,85,247,0.3); color: #c084fc; background: rgba(168,85,247,0.07); }
.stat-pill.pink { border-color: rgba(236,72,153,0.3); color: #f9a8d4; background: rgba(236,72,153,0.07); }
.stat-pill.orange { border-color: rgba(249,115,22,0.3); color: #fdba74; background: rgba(249,115,22,0.07); }

.glass-card {
    background: rgba(255,255,255,0.03);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 1.5rem;
    margin-bottom: 1rem;
    transition: all 0.3s ease;
}
.glass-card:hover {
    border-color: rgba(78, 205, 196, 0.25);
    box-shadow: 0 8px 40px rgba(78, 205, 196, 0.08);
    transform: translateY(-2px);
}

.section-label {
    font-size: 0.7rem;
    font-weight: 700;
    color: #4ecdc4;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 0.4rem;
}

.wand-section-title {
    font-family: 'Poppins', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #f8fafc;
    margin-bottom: 0.5rem;
}

.vibe-badge {
    display: inline-block;
    background: linear-gradient(135deg, rgba(168,85,247,0.25), rgba(236,72,153,0.25));
    border: 1px solid rgba(168, 85, 247, 0.4);
    color: #e879f9;
    border-radius: 8px;
    padding: 3px 12px;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
}

.budget-badge {
    display: inline-block;
    border-radius: 8px;
    padding: 3px 10px;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.5px;
}
.budget-low { background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3); color: #86efac; }
.budget-med { background: rgba(234,179,8,0.15); border: 1px solid rgba(234,179,8,0.3); color: #fde68a; }
.budget-high { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; }

.india-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    overflow: hidden;
    transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
    height: 100%;
}
.india-card:hover {
    border-color: rgba(78, 205, 196, 0.3);
    box-shadow: 0 12px 48px rgba(0,0,0,0.4);
    transform: translateY(-4px);
}
.india-card-header {
    padding: 2rem 1.5rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 12px;
}
.india-card-emoji {
    font-size: 2.5rem;
    line-height: 1;
}
.india-card-body {
    padding: 0 1.5rem 1.5rem;
}
.india-card-name {
    font-family: 'Poppins', sans-serif;
    font-size: 1.3rem;
    font-weight: 800;
    color: #f8fafc;
    margin: 0;
}
.india-card-season {
    font-size: 0.78rem;
    color: #94a3b8;
    margin-top: 2px;
}
.highlight-chip {
    display: inline-block;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 50px;
    padding: 3px 10px;
    font-size: 0.72rem;
    color: #94a3b8;
    margin: 3px 3px 0 0;
}

.countdown-box {
    text-align: center;
    background: linear-gradient(135deg, rgba(78,205,196,0.08), rgba(168,85,247,0.08));
    border: 1px solid rgba(78, 205, 196, 0.2);
    border-radius: 18px;
    padding: 1.25rem;
    margin-bottom: 1rem;
}
.countdown-num {
    font-family: 'Poppins', sans-serif;
    font-size: 2.8rem;
    font-weight: 900;
    background: linear-gradient(135deg, #4ecdc4, #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
    display: block;
}
.countdown-lbl {
    font-size: 0.68rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    font-weight: 700;
    margin-top: 4px;
}

.pack-category-header {
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    color: #f8fafc;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    display: flex;
    align-items: center;
    gap: 8px;
}

.sidebar-divider {
    border: none;
    border-top: 1px solid rgba(255,255,255,0.07);
    margin: 0.75rem 0;
}

.result-section {
    margin-top: 1rem;
}

.quick-ask-chip {
    display: inline-block;
    background: rgba(78, 205, 196, 0.08);
    border: 1px solid rgba(78, 205, 196, 0.2);
    border-radius: 50px;
    padding: 5px 14px;
    font-size: 0.8rem;
    color: #4ecdc4;
    margin: 4px 4px 0 0;
    cursor: pointer;
    transition: all 0.2s ease;
}
.quick-ask-chip:hover {
    background: rgba(78, 205, 196, 0.15);
    border-color: rgba(78, 205, 196, 0.4);
}

.payment-tip-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 0.75rem;
    background: rgba(255,255,255,0.03);
    border-radius: 12px;
    margin-bottom: 8px;
    border: 1px solid rgba(255,255,255,0.06);
}

.weather-widget {
    background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(14,165,233,0.1));
    border: 1px solid rgba(59, 130, 246, 0.25);
    border-radius: 16px;
    padding: 1rem 1.25rem;
    margin-bottom: 1rem;
}
</style>
""", unsafe_allow_html=True)


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────
def load_json_asset(path):
    try:
        with open(path, "r") as f:
            return json.load(f)
    except Exception:
        return []


def get_airplane_lottie():
    return {
        "v": "5.5.7", "fr": 30, "ip": 0, "op": 90, "w": 500, "h": 500,
        "nm": "Airplane", "ddd": 0, "assets": [],
        "layers": [{
            "ddd": 0, "ind": 1, "ty": 4, "nm": "Airplane",
            "sr": 1, "ks": {
                "o": {"a": 0, "k": 100},
                "r": {"a": 1, "k": [
                    {"i": {"x": [0.833], "y": [0.833]}, "o": {"x": [0.167], "y": [0.167]}, "t": 0, "s": [-10]},
                    {"i": {"x": [0.833], "y": [0.833]}, "o": {"x": [0.167], "y": [0.167]}, "t": 45, "s": [10]},
                    {"t": 90, "s": [-10]}
                ]},
                "p": {"a": 1, "k": [
                    {"i": {"x": 0.833, "y": 0.833}, "o": {"x": 0.167, "y": 0.167}, "t": 0, "s": [100, 280, 0]},
                    {"i": {"x": 0.833, "y": 0.833}, "o": {"x": 0.167, "y": 0.167}, "t": 45, "s": [250, 220, 0]},
                    {"t": 90, "s": [400, 280, 0]}
                ]},
                "a": {"a": 0, "k": [0, 0, 0]},
                "s": {"a": 0, "k": [100, 100, 100]}
            },
            "shapes": [{"ty": "gr", "nm": "Plane Body", "it": [
                {"ty": "sr", "nm": "Plane", "sy": 1, "d": 1,
                 "pt": {"a": 0, "k": 5}, "p": {"a": 0, "k": [0, 0]},
                 "r": {"a": 0, "k": 0}, "or": {"a": 0, "k": 70},
                 "os": {"a": 0, "k": 40}, "ix": 1},
                {"ty": "fl", "nm": "Fill",
                 "c": {"a": 0, "k": [0.306, 0.8, 0.769, 1]},
                 "o": {"a": 0, "k": 100}, "r": 1},
                {"ty": "tr", "p": {"a": 0, "k": [0, 0]}, "a": {"a": 0, "k": [0, 0]},
                 "s": {"a": 0, "k": [100, 100]}, "r": {"a": 0, "k": 0}, "o": {"a": 0, "k": 100}}
            ]}],
            "ip": 0, "op": 90, "st": 0
        }]
    }


def load_lottieurl(url):
    try:
        r = requests.get(url, timeout=4)
        if r.status_code == 200:
            return r.json()
    except Exception:
        pass
    return None


def load_local_lottie(path):
    try:
        with open(path, "r") as f:
            return json.load(f)
    except Exception:
        return None


# ── Dark / Light mode CSS injection ──────────────────────────────────────────
if not st.session_state.get("dark_mode", True):
    st.markdown("""
    <style>
    .stApp {
        background: linear-gradient(180deg, #f0f4ff 0%, #ffffff 100%) !important;
        color: #0f172a !important;
    }
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #e8eeff 0%, #f0f4ff 100%) !important;
        border-right: 1px solid rgba(78,205,196,0.3) !important;
    }
    p, h1, h2, h3, h4, span, label, div { color: #0f172a !important; }
    .glass-card {
        background: rgba(255,255,255,0.85) !important;
        border-color: rgba(78,205,196,0.3) !important;
    }
    ::-webkit-scrollbar-track { background: #f0f4ff !important; }
    </style>
    """, unsafe_allow_html=True)

# Hero logo — girl travel walk cycle
lottie_anim = load_local_lottie(os.path.join(os.path.dirname(__file__), "girl travel walk cycle.json"))

# Loading animation — paperplane
lottie_loading = load_local_lottie(os.path.join(os.path.dirname(__file__), "Loading 40 _ Paperplane.json"))

VIBE_MAP = {
    "Adventure 🏔️": "adventure, outdoor activities, trekking, extreme sports",
    "Chill 🌴": "relaxation, beaches, spas, slow travel",
    "Cultural 🎭": "museums, history, local cuisine, art, festivals",
    "Romantic 💕": "couples activities, scenic dinners, sunset spots, private experiences",
    "Party 🎉": "nightlife, clubs, festivals, social events",
    "Solo 🧘": "solo-friendly, cafes, journaling spots, mindful travel"
}

PACK_EMOJIS = {
    "Clothing": "👕",
    "Toiletries": "🧴",
    "Electronics": "🔌",
    "Documents": "📄",
    "Health & Safety": "💊",
    "Misc & Comfort": "🎒"
}

PAYMENT_TIPS = [
    ("💳", "UPI First", "Use Google Pay, PhonePe, or Paytm for 90% of transactions — even street vendors accept it."),
    ("💵", "Cash Backup", "Carry ₹1000–2000 cash for remote areas, tolls, and small dhabas."),
    ("🌐", "Card Abroad", "Wise or Niyo Zero card gives you zero forex markup for international spends."),
    ("⚠️", "DCC Warning", "Decline 'Dynamic Currency Conversion' on ATMs and POS abroad — always pay in local currency."),
    ("🏧", "ATM Tip", "Use bank ATMs (SBI, HDFC, ICICI) over standalone ATMs to avoid hidden charges."),
]


# ─────────────────────────────────────────────────────────────────────────────
# SESSION STATE INIT
# ─────────────────────────────────────────────────────────────────────────────
defaults = {
    "final_itinerary": None,
    "chat_history": [],
    "budget_json": None,
    "coords": None,
    "destination": None,
    "travel_dates": None,
    "event_data": None,
    "local_tips": None,
    "pack_list": None,
    "pack_checked": {},
    "main_dest": "Tokyo, Japan",
    "main_origin": "New Delhi, India",
    "dark_mode": True,
    # ── Auth ──
    "wb_user": None,
    "wb_session": None,
    "wb_auth_mode": "login",
}
for k, v in defaults.items():
    if k not in st.session_state:
        st.session_state[k] = v


# ─────────────────────────────────────────────────────────────────────────────
# HERO HEADER
# ─────────────────────────────────────────────────────────────────────────────
hero_l, hero_r = st.columns([4, 1])
with hero_l:
    st.markdown("""
    <div style="padding: 1rem 0 0.25rem 0;">
        <p style="font-size:0.72rem;color:#a855f7;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;margin:0 0 0.5rem 0;">✦ AI-POWERED TRAVEL INTELLIGENCE</p>
        <h1 class="wand-hero-title">Wandrly</h1>
        <p class="wand-tagline">Plan it. Vibe it. <strong style="color:#f8fafc;">Live it.</strong> — Multi-Agent AI for your next adventure</p>
        <div style="margin-top:0.9rem;line-height:2.2;">
            <span class="stat-pill teal">🤖 6 AI Agents</span>
            <span class="stat-pill purple">🗺️ Live Flights & Hotels</span>
            <span class="stat-pill pink">🎯 RAG-Powered Research</span>
            <span class="stat-pill orange">🧳 Smart Packing AI</span>
        </div>
    </div>
    """, unsafe_allow_html=True)
with hero_r:
    if lottie_anim:
        st_lottie(lottie_anim, height=240, key="hero_girl")

st.markdown("<div style='margin-bottom:0.5rem'></div>", unsafe_allow_html=True)


# ─────────────────────────────────────────────────────────────────────────────
# MAIN TABS
# ─────────────────────────────────────────────────────────────────────────────
tab_plan, tab_vibe, tab_india, tab_pack, tab_history, tab_flights = st.tabs([
    "🗺️  Plan My Trip",
    "✨  Vibe Match",
    "🇮🇳  Explore India",
    "🧳  Pack Smart",
    "🗂️  Trip History",
    "✈️  Flight Tracker",
])


# ═════════════════════════════════════════════════════════════════════════════
# TAB 1 — PLAN MY TRIP
# ═════════════════════════════════════════════════════════════════════════════
with tab_plan:

    # ── SIDEBAR ──────────────────────────────────────────────────────────────
    with st.sidebar:

        # ── AUTH PANEL ───────────────────────────────────────────────────────
        supabase_ok = bool(os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_ANON_KEY"))

        if supabase_ok:
            if st.session_state.wb_user:
                # Logged-in pill
                user_email = st.session_state.wb_user.email
                st.markdown(f"""
                <div style="background:rgba(78,205,196,0.08);border:1px solid rgba(78,205,196,0.25);
                            border-radius:14px;padding:0.75rem 1rem;margin-bottom:0.75rem;">
                    <p style="margin:0;font-size:0.68rem;color:#4ecdc4;font-weight:700;
                               letter-spacing:1px;text-transform:uppercase;">Signed in as</p>
                    <p style="margin:4px 0 0 0;font-size:0.85rem;color:#f8fafc;
                               font-weight:600;word-break:break-all;">{user_email}</p>
                </div>
                """, unsafe_allow_html=True)
                if st.button("🚪 Sign Out", use_container_width=True, key="btn_signout"):
                    wb_auth.sign_out()
                    st.session_state.wb_user = None
                    st.session_state.wb_session = None
                    st.rerun()
            else:
                # Auth toggle
                mode_col1, mode_col2 = st.columns(2)
                with mode_col1:
                    if st.button("Login", use_container_width=True, key="btn_mode_login",
                                 type="primary" if st.session_state.wb_auth_mode == "login" else "secondary"):
                        st.session_state.wb_auth_mode = "login"
                with mode_col2:
                    if st.button("Register", use_container_width=True, key="btn_mode_reg",
                                 type="primary" if st.session_state.wb_auth_mode == "register" else "secondary"):
                        st.session_state.wb_auth_mode = "register"

                with st.form("auth_form", clear_on_submit=True):
                    auth_email = st.text_input("Email", placeholder="you@example.com", key="auth_email")
                    auth_pass  = st.text_input("Password", type="password", key="auth_pass")
                    auth_submit = st.form_submit_button(
                        "✅ Sign In" if st.session_state.wb_auth_mode == "login" else "🚀 Create Account",
                        use_container_width=True
                    )
                    if auth_submit:
                        if st.session_state.wb_auth_mode == "login":
                            result = wb_auth.sign_in(auth_email, auth_pass)
                        else:
                            result = wb_auth.sign_up(auth_email, auth_pass)
                        if result["ok"]:
                            st.session_state.wb_user = result["user"]
                            st.session_state.wb_session = result["session"]
                            st.success("Welcome! 🎉")
                            st.rerun()
                        else:
                            st.error(result["error"])

            st.markdown('<hr class="sidebar-divider">', unsafe_allow_html=True)
        # ─────────────────────────────────────────────────────────────────────

        st.markdown("""
        <div style="padding:0.5rem 0 1rem 0;">
            <p style="font-family:'Poppins',sans-serif;font-size:1.25rem;font-weight:800;
                      background:linear-gradient(135deg,#4ecdc4,#a855f7);
                      -webkit-background-clip:text;-webkit-text-fill-color:transparent;
                      background-clip:text;margin:0;">Trip Details</p>
            <p style="font-size:0.78rem;color:#64748b;margin:2px 0 0 0;">
                Fill in the details and let AI do the heavy lifting.</p>
        </div>
        """, unsafe_allow_html=True)

        st.markdown('<p class="section-label">📍 Where To?</p>', unsafe_allow_html=True)
        origin = st.text_input("From", st.session_state.main_origin, key="input_origin",
                               placeholder="e.g. New Delhi, India")
        destination = st.text_input("To", st.session_state.main_dest, key="input_dest",
                                    placeholder="e.g. Tokyo, Japan")

        st.markdown('<hr class="sidebar-divider">', unsafe_allow_html=True)
        st.markdown('<p class="section-label">📅 When?</p>', unsafe_allow_html=True)
        today = date.today()
        default_start = today + timedelta(days=30)
        default_end = default_start + timedelta(days=7)
        travel_dates = st.date_input(
            "Travel Window",
            value=(default_start, default_end),
            min_value=today
        )

        # Countdown
        if isinstance(travel_dates, (tuple, list)) and len(travel_dates) >= 1:
            days_left = (travel_dates[0] - today).days
            if days_left > 0:
                st.markdown(f"""
                <div class="countdown-box">
                    <span class="countdown-num">{days_left}</span>
                    <span class="countdown-lbl">days until departure</span>
                </div>
                """, unsafe_allow_html=True)
            elif days_left == 0:
                st.markdown("""
                <div class="countdown-box">
                    <span class="countdown-num">✈️</span>
                    <span class="countdown-lbl">Today's the day! Bon Voyage!</span>
                </div>
                """, unsafe_allow_html=True)

        st.markdown('<hr class="sidebar-divider">', unsafe_allow_html=True)
        st.markdown('<p class="section-label">👥 Who\'s Coming?</p>', unsafe_allow_html=True)
        no_of_members = st.number_input("Travellers", min_value=1, max_value=50, value=2, step=1)

        st.markdown('<hr class="sidebar-divider">', unsafe_allow_html=True)
        st.markdown('<p class="section-label">✨ Trip Vibe</p>', unsafe_allow_html=True)
        trip_vibe = st.radio(
            "Pick a vibe",
            list(VIBE_MAP.keys()),
            horizontal=False,
            label_visibility="collapsed"
        )

        st.markdown('<hr class="sidebar-divider">', unsafe_allow_html=True)
        st.markdown('<p class="section-label">🎯 Interests</p>', unsafe_allow_html=True)
        interests = st.text_area(
            "What do you love?",
            VIBE_MAP[trip_vibe],
            height=80,
            placeholder="e.g. street food, photography, hiking..."
        )

        st.markdown('<hr class="sidebar-divider">', unsafe_allow_html=True)
        st.markdown('<p class="section-label">⚙️ Options</p>', unsafe_allow_html=True)
        col_chk1, col_chk2 = st.columns(2)
        with col_chk1:
            only_veg = st.checkbox("🥗 Veg Only", value=False)
        with col_chk2:
            religious = st.checkbox("🛕 Religious Sites", value=False)

        st.markdown('<hr class="sidebar-divider">', unsafe_allow_html=True)
        dm_col1, dm_col2 = st.columns([3, 1])
        with dm_col1:
            st.markdown('<p class="section-label" style="margin:0.5rem 0 0 0;">🌙 Dark Mode</p>', unsafe_allow_html=True)
        with dm_col2:
            new_dark = st.toggle("", value=st.session_state.dark_mode, key="toggle_dark", label_visibility="collapsed")
        if new_dark != st.session_state.dark_mode:
            st.session_state.dark_mode = new_dark
            st.rerun()

        st.markdown("<div style='margin-top:1rem'></div>", unsafe_allow_html=True)
        plan_button = st.button("🚀  Plan My Trip!", use_container_width=True)

    # ── PLAN EXECUTION ────────────────────────────────────────────────────────
    if plan_button:
        if not isinstance(travel_dates, (tuple, list)) or len(travel_dates) != 2:
            st.error("⚠️ Please select both a start and end date.")
        elif not os.environ.get("GROQ_API_KEY") or not os.environ.get("SERPAPI_KEY"):
            st.error("⚠️ Missing API keys — ensure GROQ_API_KEY and SERPAPI_KEY are in your .env file.")
        else:
            st.session_state.chat_history = []
            st.session_state.local_tips = None
            st.session_state.destination = destination
            st.session_state.travel_dates = travel_dates
            start_date = travel_dates[0].strftime("%Y-%m-%d")
            end_date = travel_dates[1].strftime("%Y-%m-%d")
            no_of_days = (travel_dates[1] - travel_dates[0]).days

            # Destination image gallery — show paperplane while fetching
            img_loader_ph = st.empty()
            if lottie_loading:
                with img_loader_ph.container():
                    st_lottie(lottie_loading, height=220, key="paperplane_img_fetch")

            images = fetch_images(destination)
            img_loader_ph.empty()

            if images:
                st.markdown(f"""
                <div style="display:flex;gap:12px;margin-bottom:1.5rem;border-radius:18px;overflow:hidden;">
                    {"".join(
                        f'<div style="flex:1;min-width:0;position:relative;overflow:hidden;border-radius:14px;">'
                        f'<img src="{url}" style="width:100%;height:220px;object-fit:cover;display:block;'
                        f'transition:transform 0.4s ease;" '
                        f'onmouseover="this.style.transform=\'scale(1.05)\'" '
                        f'onmouseout="this.style.transform=\'scale(1)\'">'
                        f'<div style="position:absolute;bottom:0;left:0;right:0;padding:0.5rem 0.75rem;'
                        f'background:linear-gradient(transparent,rgba(0,0,0,0.7));'
                        f'color:#fff;font-size:0.75rem;font-weight:600;">📍 {destination}</div>'
                        f'</div>'
                        for url in images
                    )}
                </div>
                """, unsafe_allow_html=True)

            # ── LOADING UI — paperplane + progress bar ──────────────────────
            # Render the paperplane ONCE with a fixed key to avoid duplicate-key errors
            if lottie_loading:
                st_lottie(lottie_loading, height=260, key="paperplane_loader")

            progress_ph = st.empty()
            STEPS = 9  # total agent steps

            def _update_progress(step: int, label: str = ""):
                pct = int((step / STEPS) * 100)
                with progress_ph.container():
                    st.markdown(
                        f"""
                        <div style="margin:0.5rem 0 0.25rem 0;">
                            <div style="display:flex;justify-content:space-between;
                                        align-items:center;margin-bottom:6px;">
                                <span style="font-size:0.8rem;color:#94a3b8;font-weight:600;
                                             letter-spacing:0.5px;">{label}</span>
                                <span style="font-size:0.95rem;font-weight:800;
                                             background:linear-gradient(135deg,#4ecdc4,#a855f7);
                                             -webkit-background-clip:text;
                                             -webkit-text-fill-color:transparent;
                                             background-clip:text;">{pct}%</span>
                            </div>
                            <div style="height:6px;border-radius:99px;
                                        background:rgba(255,255,255,0.07);overflow:hidden;">
                                <div style="height:100%;width:{pct}%;
                                            background:linear-gradient(90deg,#4ecdc4,#a855f7,#ec4899);
                                            border-radius:99px;
                                            transition:width 0.4s ease;"></div>
                            </div>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )

            _update_progress(0, "🔥 Warming up the engines…")

            try:
                _update_progress(1, "🧠 Planner Agent — breaking your trip into research tasks…")
                task_list = planner_agent(origin, destination, start_date, end_date, no_of_members, interests)

                _update_progress(2, "🏨 Booking Agent — fetching live flights & hotels…")
                booking_data = booking_agent(origin, destination, start_date, end_date, no_of_members)

                _update_progress(3, "💰 Budget Agent — crunching the numbers…")
                budget_raw = budget_agent(booking_data, no_of_days, no_of_members, destination)
                try:
                    st.session_state.budget_json = json.loads(budget_raw)
                except Exception:
                    st.session_state.budget_json = None

                _update_progress(4, "🎉 Events Agent — finding what's on during your trip…")
                st.session_state.event_data = fetch_events(destination, start_date, end_date)

                _update_progress(5, "📰 Blog Scraper — hunting hidden gems from travel blogs…")
                scraped_text = fetch_and_scrape_blogs(destination)

                _update_progress(6, "🧬 RAG Engine — building destination knowledge base…")
                vector_db = build_vector_db(scraped_text)

                _update_progress(7, "🔍 Research Agent — deep-diving your destination…")
                research_data = research_agent(task_list, destination, vector_db)

                _update_progress(8, "✍️ Summary Agent — crafting your perfect day-by-day itinerary…")
                vibe_note = f"Trip vibe: {trip_vibe}. Dietary: {'Vegetarian only' if only_veg else 'No restrictions'}. {'Include religious sites.' if religious else ''}"
                final_itinerary = summary_agent(research_data, booking_data, st.session_state.event_data, start_date, end_date, destination)
                st.session_state.final_itinerary = final_itinerary

                _update_progress(9, "🌏 Local Tips Agent — loading insider knowledge…")
                st.session_state.local_tips = local_tips_agent(destination)

                _update_progress(9, "📍 Pinning your destination on the map…")
                st.session_state.coords = get_coordinates(destination)

                # ── Auto-save to Supabase if logged in ───────────────────────
                if st.session_state.get("wb_user"):
                    wb_auth.save_trip(
                        user_id=st.session_state.wb_user.id,
                        trip={
                            "destination": destination,
                            "origin": origin,
                            "start_date": start_date,
                            "end_date": end_date,
                            "members": no_of_members,
                            "itinerary": st.session_state.final_itinerary,
                            "budget_json": st.session_state.budget_json,
                            "local_tips": st.session_state.local_tips or "",
                        }
                    )

            except Exception as e:
                if "429" in str(e):
                    st.error("⏳ Rate limit hit — wait a moment and try again.")
                else:
                    st.error(f"❌ Something went wrong: {str(e)}")
            finally:
                progress_ph.empty()

    # ── RESULTS ───────────────────────────────────────────────────────────────
    if st.session_state.final_itinerary:

        # Monsoon weather warning
        if st.session_state.coords and st.session_state.travel_dates and len(st.session_state.travel_dates) == 2:
            try:
                url = (
                    f"https://api.open-meteo.com/v1/forecast"
                    f"?latitude={st.session_state.coords[0]}"
                    f"&longitude={st.session_state.coords[1]}"
                    f"&daily=precipitation_sum,temperature_2m_max,temperature_2m_min"
                    f"&start_date={st.session_state.travel_dates[0].isoformat()}"
                    f"&end_date={st.session_state.travel_dates[1].isoformat()}"
                    f"&timezone=auto"
                )
                resp = requests.get(url, timeout=5)
                w_data = resp.json().get("daily", {})
                precip = w_data.get("precipitation_sum", [])
                temps_max = w_data.get("temperature_2m_max", [])
                temps_min = w_data.get("temperature_2m_min", [])

                if any(p and p > 30 for p in precip):
                    st.warning("⛈️ Heavy rainfall expected during your trip — pack a rain jacket and check monsoon advisories.")

                if temps_max:
                    avg_max = round(sum(t for t in temps_max if t) / len([t for t in temps_max if t]), 1)
                    avg_min = round(sum(t for t in temps_min if t) / len([t for t in temps_min if t]), 1)
                    st.markdown(f"""
                    <div class="weather-widget">
                        <p style="margin:0;font-size:0.72rem;color:#93c5fd;font-weight:700;
                                  letter-spacing:1px;text-transform:uppercase;">🌤️ Weather Forecast</p>
                        <p style="margin:6px 0 0 0;color:#f8fafc;font-size:1rem;font-weight:600;">
                            {st.session_state.destination} — {avg_min}°C to {avg_max}°C during your stay
                        </p>
                    </div>
                    """, unsafe_allow_html=True)
            except Exception:
                pass

        st.markdown("<div style='margin:1rem 0 0.5rem 0'></div>", unsafe_allow_html=True)

        # Trip header banner
        dest_name = st.session_state.destination
        if st.session_state.travel_dates and len(st.session_state.travel_dates) == 2:
            d0 = st.session_state.travel_dates[0].strftime("%b %d")
            d1 = st.session_state.travel_dates[1].strftime("%b %d, %Y")
            no_days = (st.session_state.travel_dates[1] - st.session_state.travel_dates[0]).days
        else:
            d0, d1, no_days = "—", "—", "—"

        st.markdown(f"""
        <div class="glass-card" style="background:linear-gradient(135deg,rgba(78,205,196,0.07),rgba(168,85,247,0.07));
             border-color:rgba(78,205,196,0.2);">
            <p style="font-size:0.72rem;color:#a855f7;font-weight:700;letter-spacing:2px;
                      text-transform:uppercase;margin:0 0 0.4rem 0;">✦ Your Trip Is Ready</p>
            <h2 style="font-family:'Poppins',sans-serif;font-size:1.8rem;font-weight:900;
                       color:#f8fafc;margin:0 0 0.3rem 0;">
                ✈️ {dest_name}
            </h2>
            <p style="color:#94a3b8;margin:0;font-size:0.92rem;">
                📅 {d0} → {d1} &nbsp;·&nbsp; 🌙 {no_days} nights &nbsp;·&nbsp;
                👥 {no_of_members} traveller{'s' if no_of_members > 1 else ''}
            </p>
        </div>
        """, unsafe_allow_html=True)

        # Result sub-tabs
        rt1, rt2, rt3, rt4, rt5, rt6 = st.tabs([
            "📋 Itinerary",
            "💰 Budget",
            "📍 Map",
            "🎉 Events",
            "💡 Local Tips",
            "💳 Travel Tips"
        ])

        # ── Sub-tab 1: Itinerary ──
        with rt1:
            st.markdown(st.session_state.final_itinerary)

            st.divider()
            st.markdown('<p class="section-label">💾 Export Your Itinerary</p>', unsafe_allow_html=True)
            ex1, ex2, ex3, ex4 = st.columns(4)

            with ex1:
                st.download_button(
                    label="📥 Markdown",
                    data=st.session_state.final_itinerary,
                    file_name=f"Wandrly_{dest_name.replace(' ','_')}.md",
                    mime="text/markdown",
                    use_container_width=True
                )
            with ex2:
                try:
                    pdf = MarkdownPdf(toc_level=2)
                    pdf_content = f"# Wandrly — Trip to {dest_name}\n\n" + st.session_state.final_itinerary
                    pdf.add_section(Section(pdf_content))
                    pdf_path = f"/tmp/wandrly_{dest_name.replace(' ','_')}.pdf"
                    pdf.save(pdf_path)
                    with open(pdf_path, "rb") as pf:
                        st.download_button(
                            label="📄 PDF",
                            data=pf,
                            file_name=f"Wandrly_{dest_name.replace(' ','_')}.pdf",
                            mime="application/pdf",
                            use_container_width=True
                        )
                except Exception as e:
                    st.caption(f"PDF error: {e}")
            with ex3:
                cal = Calendar()
                ev = Event()
                ev.name = f"✈️ Trip to {dest_name} — Wandrly"
                if st.session_state.travel_dates and len(st.session_state.travel_dates) == 2:
                    ev.begin = st.session_state.travel_dates[0].strftime("%Y-%m-%d")
                    ev.end = st.session_state.travel_dates[1].strftime("%Y-%m-%d")
                ev.description = st.session_state.final_itinerary
                cal.events.add(ev)
                st.download_button(
                    label="📅 Calendar",
                    data=str(cal),
                    file_name="wandrly_trip.ics",
                    mime="text/calendar",
                    use_container_width=True
                )
            with ex4:
                wa_text = urllib.parse.quote(f"✈️ Check out my trip to {dest_name}!\n\n{st.session_state.final_itinerary[:500]}...")
                st.markdown(
                    f'<a href="https://api.whatsapp.com/send?text={wa_text}" target="_blank">'
                    f'<button style="width:100%;background:rgba(37,211,102,0.15);border:1px solid rgba(37,211,102,0.4);'
                    f'color:#4ade80;border-radius:12px;padding:0.6rem 0;font-weight:600;font-size:0.85rem;cursor:pointer;">'
                    f'📱 WhatsApp</button></a>',
                    unsafe_allow_html=True
                )

        # ── Sub-tab 2: Budget ──
        with rt2:
            if st.session_state.budget_json:
                b = {k: _to_int(v) for k, v in st.session_state.budget_json.items()}
                total = sum(b.values())
                flights = b.get("Flights", 0)
                hotels = b.get("Hotels", 0)
                food = b.get("Food", 0)
                activities = b.get("Activities", 0)
                transport = b.get("Transport", 0)

                m1, m2, m3 = st.columns(3)
                m1.metric("💰 Total Budget", f"₹{total:,}")
                m2.metric("✈️ Flights", f"₹{flights:,}")
                m3.metric("🏨 Hotels", f"₹{hotels:,}")

                m4, m5 = st.columns(2)
                m4.metric("🍜 Food & Dining", f"₹{food:,}")
                m5.metric("🎭 Activities", f"₹{activities:,}")

                st.markdown("<div style='margin-top:1rem'></div>", unsafe_allow_html=True)

                # Donut chart
                df = pd.DataFrame(list(b.items()), columns=["Category", "Cost (INR)"])
                color_seq = ["#4ecdc4", "#a855f7", "#ec4899", "#f97316", "#3b82f6"]
                fig = go.Figure(data=[go.Pie(
                    labels=df["Category"],
                    values=df["Cost (INR)"],
                    hole=0.55,
                    marker=dict(colors=color_seq, line=dict(color="#080d1a", width=3)),
                    textinfo="label+percent",
                    textfont=dict(color="#f8fafc", size=12),
                    hovertemplate="<b>%{label}</b><br>₹%{value:,}<br>%{percent}<extra></extra>"
                )])
                fig.add_annotation(
                    text=f"<b>₹{total:,}</b><br><span style='font-size:11px'>Total</span>",
                    x=0.5, y=0.5, showarrow=False,
                    font=dict(size=18, color="#f8fafc"),
                    align="center"
                )
                fig.update_layout(
                    paper_bgcolor="rgba(0,0,0,0)",
                    plot_bgcolor="rgba(0,0,0,0)",
                    showlegend=True,
                    legend=dict(
                        font=dict(color="#94a3b8", size=12),
                        bgcolor="rgba(0,0,0,0)",
                        bordercolor="rgba(255,255,255,0.08)",
                        borderwidth=1
                    ),
                    margin=dict(t=20, b=20, l=20, r=20),
                    height=380
                )
                st.plotly_chart(fig, use_container_width=True)

                # Per-person breakdown
                if no_of_members > 1:
                    st.info(f"💡 Per person cost: **₹{total // no_of_members:,}** across {no_of_members} travellers")

                # State transport guide
                transport_data = load_json_asset(os.path.join("assets", "state_transport.json"))
                if st.session_state.coords and transport_data:
                    try:
                        from geopy.geocoders import Nominatim
                        gc = Nominatim(user_agent="wandrly_app")
                        loc = gc.reverse(f"{st.session_state.coords[0]}, {st.session_state.coords[1]}", language="en")
                        state_name = loc.raw.get("address", {}).get("state") if loc else None
                        if state_name:
                            guide = next((g for g in transport_data if g["state"] == state_name), None)
                            if guide:
                                st.markdown(f"""
                                <div class="glass-card" style="margin-top:1rem;">
                                    <p class="section-label">🚦 Local Transport — {state_name}</p>
                                    <p style="color:#f8fafc;font-weight:600;margin:0.3rem 0 0.15rem 0;">{guide['transport']}</p>
                                    <p style="color:#94a3b8;font-size:0.85rem;margin:0 0 0.5rem 0;">{guide['fare_range']}</p>
                                    <p style="color:#4ecdc4;font-size:0.85rem;margin:0;">💡 {guide.get('tip','')}</p>
                                </div>
                                """, unsafe_allow_html=True)
                    except Exception:
                        pass
            else:
                st.warning("Budget data not available — the AI may have returned an unexpected format.")

        # ── Sub-tab 3: Map ──
        with rt3:
            if st.session_state.coords:
                lat, lon = st.session_state.coords
                m = folium.Map(
                    location=[lat, lon],
                    zoom_start=12,
                    tiles="CartoDB dark_matter"
                )
                folium.Marker(
                    [lat, lon],
                    popup=folium.Popup(f"<b>{dest_name}</b>", max_width=200),
                    tooltip=dest_name,
                    icon=folium.Icon(color="purple", icon="plane", prefix="fa")
                ).add_to(m)
                folium.Circle(
                    [lat, lon], radius=5000,
                    color="#4ecdc4", fill=True, fill_opacity=0.08,
                    weight=1.5
                ).add_to(m)
                st_folium(m, width="100%", height=480)
            else:
                st.warning("Map coordinates not available.")

        # ── Sub-tab 4: Events ──
        with rt4:
            if st.session_state.event_data:
                st.markdown('<p class="section-label">🎉 What\'s Happening</p>', unsafe_allow_html=True)
                st.markdown(f"""
                <div class="glass-card">
                {st.session_state.event_data}
                </div>
                """, unsafe_allow_html=True)
            else:
                st.info("No event data fetched yet — run a trip plan first.")

        # ── Sub-tab 5: Local Tips ──
        with rt5:
            if st.session_state.local_tips:
                st.markdown(st.session_state.local_tips)
            else:
                if st.button("💡 Load Local Tips", use_container_width=True):
                    with st.spinner("Getting insider tips from locals..."):
                        st.session_state.local_tips = local_tips_agent(st.session_state.destination)
                    st.rerun()

        # ── Sub-tab 6: Travel Tips ──
        with rt6:
            st.markdown('<p class="section-label">💳 Money & Payment</p>', unsafe_allow_html=True)
            for icon, title, desc in PAYMENT_TIPS:
                st.markdown(f"""
                <div class="payment-tip-item">
                    <span style="font-size:1.4rem;min-width:28px;">{icon}</span>
                    <div>
                        <p style="margin:0;font-weight:700;color:#f8fafc;font-size:0.9rem;">{title}</p>
                        <p style="margin:0;color:#94a3b8;font-size:0.83rem;">{desc}</p>
                    </div>
                </div>
                """, unsafe_allow_html=True)

            st.markdown("<div style='margin-top:1.5rem'></div>", unsafe_allow_html=True)
            st.markdown('<p class="section-label">📋 Quick Pre-Trip Checklist</p>', unsafe_allow_html=True)
            checklist_items = [
                "Valid passport / ID (check expiry — needs 6 months beyond return date)",
                "Travel insurance purchased",
                "Accommodation bookings confirmed",
                "Notify bank of travel dates",
                "Download offline maps (Google Maps / Maps.me)",
                "Emergency contacts saved offline",
                "Vaccines / health requirements checked",
                "Local currency or forex card ready",
            ]
            for item in checklist_items:
                st.checkbox(item, key=f"pre_trip_{item[:20]}")

        # ── AI CHAT ASSISTANT ─────────────────────────────────────────────────
        st.divider()
        st.markdown("""
        <div style="margin-bottom:0.75rem;">
            <p class="section-label">🤖 Trip Assistant</p>
            <p style="color:#94a3b8;font-size:0.88rem;margin:0;">
                Ask anything — modify the itinerary, get restaurant recommendations, or just vibe-check your trip.
            </p>
        </div>
        """, unsafe_allow_html=True)

        # Suggested questions
        suggested_qs = [
            "What should I pack?",
            "Best local restaurants?",
            "Add a day trip option",
            "Budget-saving tips?",
            "What to avoid there?",
        ]
        st.markdown(
            "".join(f'<span class="quick-ask-chip">{q}</span>' for q in suggested_qs),
            unsafe_allow_html=True
        )
        st.markdown("<div style='margin-bottom:0.5rem'></div>", unsafe_allow_html=True)

        for msg in st.session_state.chat_history:
            with st.chat_message(msg["role"]):
                st.markdown(msg["content"])

        if prompt := st.chat_input("Ask anything about your trip... ✈️"):
            with st.chat_message("user"):
                st.markdown(prompt)
            st.session_state.chat_history.append({"role": "user", "content": prompt})
            with st.chat_message("assistant"):
                with st.spinner("Thinking..."):
                    history_str = "\n".join(
                        f"{m['role']}: {m['content']}"
                        for m in st.session_state.chat_history[-6:]
                    )
                    response = chat_agent(st.session_state.final_itinerary, history_str, prompt)
                    st.markdown(response)
                    st.session_state.chat_history.append({"role": "assistant", "content": response})


# ═════════════════════════════════════════════════════════════════════════════
# TAB 2 — VIBE MATCH (Destination Suggester)
# ═════════════════════════════════════════════════════════════════════════════
with tab_vibe:
    st.markdown("""
    <div style="margin-bottom:1.5rem;">
        <p class="section-label">🔮 AI Destination Matcher</p>
        <h2 class="wand-section-title">Where should you go?</h2>
        <p style="color:#64748b;font-size:0.9rem;margin:0;">
            Answer 4 quick questions and our AI finds your perfect match.
        </p>
    </div>
    """, unsafe_allow_html=True)

    vm1, vm2 = st.columns([1, 1], gap="large")
    with vm1:
        sug_origin = st.text_input("🛫 Flying from", "New Delhi, India", key="vibe_origin")
        sug_budget = st.selectbox(
            "💸 Budget level",
            ["Low (Backpacker)", "Medium (Standard)", "High (Luxury)", "Ultra Luxury 💎"]
        )
    with vm2:
        sug_weather = st.selectbox(
            "🌡️ Preferred weather",
            ["Sunny & Tropical 🏖️", "Mild & Pleasant ⛅", "Cold & Snowy ❄️", "Desert Heat 🏜️", "Misty & Green 🌿"]
        )
        sug_month = st.selectbox(
            "📅 Travel month",
            ["January", "February", "March", "April", "May", "June",
             "July", "August", "September", "October", "November", "December"]
        )

    sug_style = st.multiselect(
        "🎯 Travel style (pick all that apply)",
        ["Adventure", "Beach", "Culture & History", "Food & Culinary", "Nightlife", "Nature", "Wellness", "Budget", "Luxury", "Solo", "Family", "Romantic"],
        default=["Culture & History", "Food & Culinary"]
    )

    if st.button("✨ Find My Perfect Destination!", use_container_width=True):
        if not os.environ.get("GROQ_API_KEY"):
            st.error("Missing GROQ_API_KEY in .env")
        else:
            with st.spinner("🌍 Scanning the globe for your perfect match..."):
                if lottie_anim:
                    st_lottie(lottie_anim, height=160, key="vibe_loading")
                style_str = ", ".join(sug_style) if sug_style else "General"
                suggestions = suggester_agent(sug_origin, sug_budget, sug_weather, sug_month)

            st.markdown("""
            <div class="glass-card" style="border-color:rgba(168,85,247,0.25);
                 background:linear-gradient(135deg,rgba(168,85,247,0.05),rgba(78,205,196,0.05));">
            """, unsafe_allow_html=True)
            st.markdown(suggestions)
            st.markdown("</div>", unsafe_allow_html=True)
            st.info("💡 Found your vibe? Head to **🗺️ Plan My Trip** and let's build the full itinerary!")


# ═════════════════════════════════════════════════════════════════════════════
# TAB 3 — EXPLORE INDIA
# ═════════════════════════════════════════════════════════════════════════════
with tab_india:
    st.markdown("""
    <div style="margin-bottom:1.5rem;">
        <p class="section-label">🇮🇳 Incredible India</p>
        <h2 class="wand-section-title">Discover India</h2>
        <p style="color:#64748b;font-size:0.9rem;margin:0;">
            From golden beaches to Himalayan peaks — India hits different.
        </p>
    </div>
    """, unsafe_allow_html=True)

    destinations = load_json_asset(os.path.join("assets", "discover_india.json"))

    if not destinations:
        st.warning("Destination data not found. Make sure assets/discover_india.json exists.")
    else:
        for i in range(0, len(destinations), 2):
            row_cols = st.columns(2, gap="medium")
            for j, col in enumerate(row_cols):
                if i + j < len(destinations):
                    dest = destinations[i + j]
                    with col:
                        budget_val = dest.get("budget", "Medium")
                        if "Low" in budget_val and "High" not in budget_val:
                            b_class = "budget-low"
                        elif "High" in budget_val or "Luxury" in budget_val:
                            b_class = "budget-high"
                        else:
                            b_class = "budget-med"

                        highlights_html = "".join(
                            f'<span class="highlight-chip">{h}</span>'
                            for h in dest.get("highlights", [])
                        )
                        grad = dest.get("gradient", "linear-gradient(135deg,#4ecdc4,#a855f7)")

                        st.markdown(f"""
                        <div class="india-card">
                            <div class="india-card-header"
                                 style="background:{grad};opacity:0.9;border-radius:16px 16px 0 0;margin:-1px -1px 0 -1px;">
                                <span class="india-card-emoji">{dest.get('emoji','🌍')}</span>
                                <div>
                                    <p class="india-card-name" style="color:#fff;">{dest.get('name')}</p>
                                    <p class="india-card-season" style="color:rgba(255,255,255,0.75);">
                                        🗓 Best: {dest.get('season')}
                                    </p>
                                </div>
                            </div>
                            <div class="india-card-body" style="padding-top:1rem;">
                                <div style="margin-bottom:0.75rem;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                                    <span class="vibe-badge">{dest.get('vibe','')}</span>
                                    <span class="budget-badge {b_class}">💸 {dest.get('budget','')}</span>
                                    <span style="font-size:0.78rem;color:#64748b;">🌡️ {dest.get('avg_temp','')}</span>
                                </div>
                                <p style="color:#94a3b8;font-size:0.83rem;line-height:1.6;margin-bottom:0.75rem;">
                                    {dest.get('description','')}
                                </p>
                                <div>{highlights_html}</div>
                                <p style="font-size:0.78rem;color:#64748b;margin-top:0.75rem;">
                                    🗣️ {dest.get('language','')}
                                </p>
                            </div>
                        </div>
                        """, unsafe_allow_html=True)

                        if st.button(
                            f"Plan Trip to {dest.get('name')} →",
                            key=f"india_{dest.get('name')}",
                            use_container_width=True
                        ):
                            st.session_state.main_dest = dest.get("name") + ", India"
                            st.session_state.main_origin = "New Delhi, India"
                            st.success(f"✅ {dest.get('name')} selected! Go to 🗺️ Plan My Trip to continue.")

                        st.markdown("<div style='margin-bottom:0.75rem'></div>", unsafe_allow_html=True)


# ═════════════════════════════════════════════════════════════════════════════
# TAB 4 — PACK SMART
# ═════════════════════════════════════════════════════════════════════════════
with tab_pack:
    st.markdown("""
    <div style="margin-bottom:1.5rem;">
        <p class="section-label">🧳 AI Packing Assistant</p>
        <h2 class="wand-section-title">Pack Smart, Travel Light</h2>
        <p style="color:#64748b;font-size:0.9rem;margin:0;">
            Tell our AI where you're going and it'll build a custom packing list. Never over-pack again.
        </p>
    </div>
    """, unsafe_allow_html=True)

    pk1, pk2 = st.columns([3, 2], gap="large")

    with pk1:
        pack_dest = st.text_input(
            "🌍 Destination",
            value=st.session_state.get("destination") or st.session_state.main_dest,
            placeholder="e.g. Bali, Indonesia"
        )
        pk_col1, pk_col2 = st.columns(2)
        with pk_col1:
            pack_days = st.number_input("🌙 Number of days", min_value=1, max_value=60, value=7, step=1)
        with pk_col2:
            pack_vibe = st.selectbox(
                "✨ Trip vibe",
                list(VIBE_MAP.keys()),
                key="pack_vibe_select"
            )
        pack_interests = st.text_input(
            "🎯 Activities planned",
            value=VIBE_MAP[pack_vibe],
            placeholder="e.g. beach, hiking, fine dining..."
        )
        gen_pack_btn = st.button("🧳 Generate Packing List", use_container_width=True)

    with pk2:
        st.markdown("""
        <div class="glass-card" style="height:100%;border-color:rgba(168,85,247,0.2);">
            <p class="section-label">💡 Packing Wisdom</p>
            <p style="color:#94a3b8;font-size:0.85rem;line-height:1.7;margin:0;">
                ✦ Roll clothes instead of folding — saves 30% space<br>
                ✦ Pack half the clothes, twice the money<br>
                ✦ Use packing cubes to stay organized<br>
                ✦ Wear your heaviest shoes on the plane<br>
                ✦ One universal power adapter beats 3 specific ones<br>
                ✦ Carry meds in original packaging at border crossings
            </p>
        </div>
        """, unsafe_allow_html=True)

    if gen_pack_btn:
        if not os.environ.get("GROQ_API_KEY"):
            st.error("Missing GROQ_API_KEY in .env")
        else:
            with st.spinner(f"🤖 Building your custom packing list for {pack_dest}..."):
                pack_raw = packing_agent(pack_dest, pack_days, pack_vibe, pack_interests)
                try:
                    pack_data = json.loads(pack_raw)
                    st.session_state.pack_list = pack_data
                    # Reset checked state for new list
                    st.session_state.pack_checked = {}
                except Exception:
                    st.error("Couldn't parse packing list — try again.")
                    pack_data = None

    if st.session_state.pack_list:
        st.divider()
        pack_data = st.session_state.pack_list

        # Summary stats
        total_items = sum(len(v) for v in pack_data.values())
        checked_count = sum(1 for v in st.session_state.pack_checked.values() if v)

        prog_cols = st.columns(3)
        prog_cols[0].metric("📦 Total Items", total_items)
        prog_cols[1].metric("✅ Packed", checked_count)
        prog_cols[2].metric("⏳ Remaining", total_items - checked_count)

        if total_items > 0:
            progress = checked_count / total_items
            st.progress(progress, text=f"{int(progress*100)}% packed")

        st.markdown("<div style='margin-top:1rem'></div>", unsafe_allow_html=True)

        # Render categories in 2 columns
        categories = list(pack_data.keys())
        half = (len(categories) + 1) // 2
        cat_cols = st.columns(2, gap="large")

        for col_idx, col in enumerate(cat_cols):
            with col:
                for cat in categories[col_idx * half:(col_idx + 1) * half]:
                    items = pack_data[cat]
                    emoji = PACK_EMOJIS.get(cat, "📦")
                    with st.expander(f"{emoji} {cat} ({len(items)} items)", expanded=True):
                        for item in items:
                            key = f"pack_{cat}_{item}"
                            if key not in st.session_state.pack_checked:
                                st.session_state.pack_checked[key] = False
                            checked = st.checkbox(
                                item,
                                value=st.session_state.pack_checked[key],
                                key=key
                            )
                            st.session_state.pack_checked[key] = checked

        # Download packing list
        st.divider()
        pack_text_lines = [f"🧳 Wandrly Packing List — {pack_dest} ({pack_days} days)\n"]
        for cat, items in pack_data.items():
            pack_text_lines.append(f"\n{PACK_EMOJIS.get(cat,'📦')} {cat}")
            pack_text_lines.append("-" * 30)
            for item in items:
                key = f"pack_{cat}_{item}"
                status = "✅" if st.session_state.pack_checked.get(key) else "☐"
                pack_text_lines.append(f"  {status} {item}")

        pack_text = "\n".join(pack_text_lines)
        st.download_button(
            "📥 Download Packing List",
            data=pack_text,
            file_name=f"Wandrly_Packlist_{pack_dest.replace(' ','_')}.txt",
            mime="text/plain",
            use_container_width=True
        )


# ═════════════════════════════════════════════════════════════════════════════
# TAB 5 — TRIP HISTORY
# ═════════════════════════════════════════════════════════════════════════════
with tab_history:
    st.markdown("""
    <div style="margin-bottom:1.5rem;">
        <p class="section-label">🗂️ Your Travel Archive</p>
        <h2 class="wand-section-title">Trip History</h2>
        <p style="color:#64748b;font-size:0.9rem;margin:0;">
            All your saved trips — revisit, re-read, or delete old adventures.
        </p>
    </div>
    """, unsafe_allow_html=True)

    supabase_ok_hist = bool(os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_ANON_KEY"))

    if not supabase_ok_hist:
        st.info("🔧 Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to your `.env` file to enable trip history.")
    elif not st.session_state.wb_user:
        st.markdown("""
        <div class="glass-card" style="text-align:center;padding:2.5rem 1.5rem;border-color:rgba(168,85,247,0.25);">
            <p style="font-size:2.5rem;margin:0 0 0.75rem 0;">🔐</p>
            <p style="font-family:'Poppins',sans-serif;font-size:1.2rem;font-weight:700;
                      color:#f8fafc;margin:0 0 0.5rem 0;">Sign in to see your trips</p>
            <p style="color:#64748b;font-size:0.88rem;margin:0;">
                Log in from the <strong style="color:#4ecdc4;">🗺️ Plan My Trip</strong> sidebar to access your saved adventures.
            </p>
        </div>
        """, unsafe_allow_html=True)
    else:
        trips = wb_auth.load_trips(st.session_state.wb_user.id)

        if not trips:
            st.markdown("""
            <div class="glass-card" style="text-align:center;padding:2.5rem 1.5rem;">
                <p style="font-size:2.5rem;margin:0 0 0.75rem 0;">✈️</p>
                <p style="font-family:'Poppins',sans-serif;font-size:1.1rem;font-weight:700;
                          color:#f8fafc;margin:0 0 0.4rem 0;">No trips saved yet</p>
                <p style="color:#64748b;font-size:0.88rem;margin:0;">
                    Plan a trip and it'll appear here automatically.
                </p>
            </div>
            """, unsafe_allow_html=True)
        else:
            st.markdown(f"""
            <p style="font-size:0.8rem;color:#64748b;margin-bottom:1rem;">
                📦 {len(trips)} trip{'s' if len(trips) != 1 else ''} saved
            </p>
            """, unsafe_allow_html=True)

            for trip in trips:
                trip_id = trip.get("id")
                dest = trip.get("destination", "Unknown")
                origin = trip.get("origin", "—")
                start = trip.get("start_date", "")
                end = trip.get("end_date", "")
                members = trip.get("members", 1)
                created_raw = trip.get("created_at", "")
                itinerary = trip.get("itinerary", "")
                local_tips = trip.get("local_tips", "")

                # Parse budget_json
                budget_json = trip.get("budget_json")
                if isinstance(budget_json, str):
                    try:
                        budget_json = json.loads(budget_json)
                    except Exception:
                        budget_json = None

                # Format created_at
                try:
                    created_dt = datetime.fromisoformat(created_raw.replace("Z", "+00:00"))
                    created_str = created_dt.strftime("%b %d, %Y at %H:%M")
                except Exception:
                    created_str = created_raw[:10] if created_raw else "—"

                # Budget total
                budget_total = ""
                if budget_json and isinstance(budget_json, dict):
                    total = sum(v for v in budget_json.values() if isinstance(v, (int, float)))
                    budget_total = f"₹{total:,.0f}"

                col_card, col_del = st.columns([11, 1])
                with col_card:
                    with st.expander(
                        f"✈️  {dest}  ·  {start} → {end}  ·  👥 {members}",
                        expanded=False
                    ):
                        # Trip meta strip
                        st.markdown(f"""
                        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:1rem;">
                            <span class="stat-pill teal">🛫 {origin}</span>
                            <span class="stat-pill purple">📅 {start} → {end}</span>
                            <span class="stat-pill pink">👥 {members} traveller{'s' if members != 1 else ''}</span>
                            {"<span class='stat-pill orange'>💰 " + budget_total + "</span>" if budget_total else ""}
                            <span class="stat-pill" style="color:#64748b;">🕒 Saved {created_str}</span>
                        </div>
                        """, unsafe_allow_html=True)

                        # Budget breakdown if available
                        if budget_json and isinstance(budget_json, dict):
                            b_cols = st.columns(min(len(budget_json), 5))
                            for idx, (cat, val) in enumerate(budget_json.items()):
                                if idx < len(b_cols):
                                    b_cols[idx].metric(cat, f"₹{_to_int(val):,}")
                            st.markdown("<div style='margin-bottom:0.5rem'></div>", unsafe_allow_html=True)

                        # Itinerary
                        if itinerary:
                            st.markdown("---")
                            st.markdown(itinerary)

                        # Local tips
                        if local_tips:
                            st.markdown("---")
                            with st.expander("💡 Local Tips", expanded=False):
                                st.markdown(local_tips)

                        # Re-download
                        dl1, dl2 = st.columns(2)
                        with dl1:
                            if itinerary:
                                st.download_button(
                                    "📥 Download Itinerary",
                                    data=itinerary,
                                    file_name=f"Wandrly_{dest.replace(' ','_')}_{start}.md",
                                    mime="text/markdown",
                                    use_container_width=True,
                                    key=f"dl_md_{trip_id}"
                                )
                        with dl2:
                            if budget_json:
                                budget_text = f"Budget for {dest} ({start} → {end})\n\n"
                                budget_text += "\n".join(f"{k}: ₹{_to_int(v):,}" for k, v in budget_json.items())
                                st.download_button(
                                    "💰 Download Budget",
                                    data=budget_text,
                                    file_name=f"Wandrly_Budget_{dest.replace(' ','_')}.txt",
                                    mime="text/plain",
                                    use_container_width=True,
                                    key=f"dl_bgt_{trip_id}"
                                )

                with col_del:
                    st.markdown("<div style='margin-top:0.35rem'></div>", unsafe_allow_html=True)
                    if st.button("🗑️", key=f"del_{trip_id}", help="Delete this trip"):
                        result = wb_auth.delete_trip(trip_id)
                        if result.get("ok"):
                            st.success("Trip deleted.")
                            st.rerun()
                        else:
                            st.error(result.get("error", "Delete failed."))


# ═════════════════════════════════════════════════════════════════════════════
# TAB 6 — FLIGHT TRACKER
# ═════════════════════════════════════════════════════════════════════════════
with tab_flights:
    st.markdown("""
    <div style="margin-bottom:1.5rem;">
        <p class="section-label">✈️ Real-Time Flight Status</p>
        <h2 class="wand-section-title">Flight Tracker</h2>
        <p style="color:#64748b;font-size:0.9rem;margin:0;">
            Track live flight status by flight number or route — powered by AviationStack.
        </p>
    </div>
    """, unsafe_allow_html=True)

    if not os.environ.get("AVIATIONSTACK_KEY"):
        st.warning("⚠️ Add `AVIATIONSTACK_KEY` to your `.env` file to enable live flight tracking.")
    else:
        ft_mode = st.radio("Search by", ["✈️ Flight Number", "🛣️ Route (IATA codes)"],
                           horizontal=True, key="ft_mode")

        ft_results = []
        ft_searched = False

        if ft_mode == "✈️ Flight Number":
            ft_col1, ft_col2 = st.columns([2, 1])
            with ft_col1:
                ft_flight = st.text_input("Flight number (e.g. AI101, 6E204)", key="ft_flight_num",
                                          placeholder="AI101").strip().upper()
            with ft_col2:
                ft_date = st.date_input("Date", value=date.today(), key="ft_date_num")
            if st.button("🔍 Track Flight", use_container_width=True, key="ft_btn_num") and ft_flight:
                with st.spinner("Fetching live flight data…"):
                    ft_results = fetch_live_flights(flight_iata=ft_flight, flight_date=str(ft_date))
                ft_searched = True
        else:
            ft_col1, ft_col2, ft_col3 = st.columns([1, 1, 1])
            with ft_col1:
                ft_dep = st.text_input("From IATA (e.g. DEL)", key="ft_dep", placeholder="DEL").strip().upper()
            with ft_col2:
                ft_arr = st.text_input("To IATA (e.g. BOM)", key="ft_arr", placeholder="BOM").strip().upper()
            with ft_col3:
                ft_date_r = st.date_input("Date", value=date.today(), key="ft_date_route")
            if st.button("🔍 Search Route", use_container_width=True, key="ft_btn_route") and ft_dep and ft_arr:
                with st.spinner("Fetching live flight data…"):
                    ft_results = fetch_live_flights(dep_iata=ft_dep, arr_iata=ft_arr, flight_date=str(ft_date_r))
                ft_searched = True

        if ft_searched and not ft_results:
            st.info("No flights found. Try a different flight number, route, or date.")
        elif ft_results:
            st.markdown(f"**{len(ft_results)} flight(s) found:**")
            for fl in ft_results:
                airline = fl.get("airline", {}).get("name", "Unknown Airline")
                fnum = fl.get("flight", {}).get("iata", "N/A")
                status = fl.get("flight_status", "unknown").upper()
                dep = fl.get("departure", {})
                arr = fl.get("arrival", {})
                dep_airport = dep.get("airport", "N/A")
                arr_airport = arr.get("airport", "N/A")
                dep_sched = dep.get("scheduled", "N/A")
                arr_sched = arr.get("scheduled", "N/A")
                dep_actual = dep.get("actual") or dep.get("estimated") or dep_sched
                arr_actual = arr.get("actual") or arr.get("estimated") or arr_sched
                delay = dep.get("delay")

                status_color = {
                    "ACTIVE": "#4ecdc4", "LANDED": "#22c55e", "SCHEDULED": "#a855f7",
                    "CANCELLED": "#ef4444", "DIVERTED": "#f59e0b"
                }.get(status, "#94a3b8")

                delay_badge = ""
                if delay and int(delay) > 0:
                    delay_badge = f'<span style="background:#f59e0b22;color:#f59e0b;border-radius:6px;padding:2px 8px;font-size:0.72rem;font-weight:700;">⏱ +{delay} min delay</span>'

                st.markdown(f"""
                <div class="glass-card" style="padding:1.25rem 1.5rem;margin-bottom:1rem;">
                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
                        <div>
                            <span style="font-size:1.1rem;font-weight:800;color:#f8fafc;">{fnum}</span>
                            <span style="color:#64748b;font-size:0.85rem;margin-left:0.5rem;">{airline}</span>
                            {delay_badge}
                        </div>
                        <span style="background:{status_color}22;color:{status_color};border-radius:8px;
                                     padding:3px 12px;font-size:0.75rem;font-weight:700;letter-spacing:0.5px;">
                            ● {status}
                        </span>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:1rem;margin-top:1rem;align-items:center;">
                        <div>
                            <p style="margin:0;font-size:0.7rem;color:#4ecdc4;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Departure</p>
                            <p style="margin:4px 0 2px 0;font-size:0.95rem;font-weight:700;color:#f8fafc;">{dep_airport}</p>
                            <p style="margin:0;font-size:0.75rem;color:#94a3b8;">Scheduled: {dep_sched[:16] if dep_sched != 'N/A' else 'N/A'}</p>
                            <p style="margin:0;font-size:0.75rem;color:#64748b;">Actual: {dep_actual[:16] if dep_actual != 'N/A' else 'N/A'}</p>
                        </div>
                        <div style="text-align:center;color:#a855f7;font-size:1.5rem;">✈️</div>
                        <div style="text-align:right;">
                            <p style="margin:0;font-size:0.7rem;color:#a855f7;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Arrival</p>
                            <p style="margin:4px 0 2px 0;font-size:0.95rem;font-weight:700;color:#f8fafc;">{arr_airport}</p>
                            <p style="margin:0;font-size:0.75rem;color:#94a3b8;">Scheduled: {arr_sched[:16] if arr_sched != 'N/A' else 'N/A'}</p>
                            <p style="margin:0;font-size:0.75rem;color:#64748b;">Actual: {arr_actual[:16] if arr_actual != 'N/A' else 'N/A'}</p>
                        </div>
                    </div>
                </div>
                """, unsafe_allow_html=True)
