<div align="center">

# 🌍 Wandrly — AI Trip Planner

**Multi-Agent AI Travel Planner powered by Groq LLaMA, SerpAPI, Supabase & RAG**

![Python](https://img.shields.io/badge/Python-3.13-blue?style=for-the-badge&logo=python)
![Streamlit](https://img.shields.io/badge/Streamlit-1.x-FF4B4B?style=for-the-badge&logo=streamlit)
![Groq](https://img.shields.io/badge/Groq-LLaMA_3.1-orange?style=for-the-badge)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Cost](https://img.shields.io/badge/Cost-$0%20Free%20Tier-brightgreen?style=for-the-badge)

*Plan it. Vibe it. Live it.*

[![Demo Video](https://img.shields.io/badge/▶_Watch_Demo-Tutorial_Video-red?style=for-the-badge&logo=github)](https://github.com/AnishSinghYadav/wandrly-ai-trip-planner/releases/tag/v1.0.0)

</div>

---

## 🎬 Demo Video

> Watch the full tutorial on how to set up and use Wandrly:

**[▶ Click here to watch the demo video](https://github.com/AnishSinghYadav/wandrly-ai-trip-planner/releases/tag/v1.0.0)**

---

## 📸 Overview

Wandrly is a fully AI-powered travel planning web application that orchestrates **6 specialized AI agents** to generate a complete, research-backed, day-by-day trip itinerary — including live hotels, flights, events, hidden gems from travel blogs, smart packing lists, and real-time flight tracking.

Built entirely on **free-tier APIs** — no paid subscriptions required.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧠 **Multi-Agent Pipeline** | 6 AI agents: Planner → Booking → Budget → Research → Summary → Local Tips |
| 🔍 **RAG-Powered Research** | Scrapes travel blogs, builds a FAISS vector DB, retrieves real hidden gems |
| 🏨 **Live Hotel & Flight Data** | Real hotel prices via MakCorps + SerpAPI, flight search via SerpAPI |
| ✈️ **Real-Time Flight Tracker** | Live flight status by flight number or route via AviationStack |
| 🗄️ **Trip History** | Save, view, and delete past trips with Supabase PostgreSQL |
| 🔐 **User Authentication** | Email/password auth via Supabase Auth with JWT sessions |
| 🌙 **Dark / Light Mode** | Sidebar toggle with instant CSS theme switching |
| 🧳 **Smart Packing List** | AI-generated packing list by category with interactive checklist |
| 🗺️ **Interactive Map** | Folium map with destination pin |
| 💰 **Budget Breakdown** | Plotly donut chart with per-person cost calculation |
| 💬 **AI Chat Assistant** | Ask questions or modify your itinerary in real time |
| 📥 **Export Options** | Download as Markdown, plain text budget, or iCal (.ics) |
| 🇮🇳 **Explore India Tab** | Curated India destinations with one-click trip planning |
| ✨ **Vibe Match** | Suggest destinations based on mood, budget, and weather preference |

---

## 🤖 Agent Architecture

```
User Input
    │
    ▼
┌─────────────────────────────────────────┐
│           Streamlit App (app.py)        │
└──────────────────┬──────────────────────┘
                   │
    ┌──────────────▼──────────────┐
    │      Agent Pipeline         │
    │                             │
    │  1. 🧠 Planner Agent        │  → SerpAPI search + LLM task breakdown
    │  2. 🏨 Booking Agent        │  → MakCorps hotels + SerpAPI flights
    │  3. 💰 Budget Agent         │  → LLM JSON cost estimate
    │  4. 🎉 Events Fetcher       │  → SerpAPI Google Events
    │  5. 📰 Blog Scraper + RAG   │  → BeautifulSoup + FAISS vector DB
    │  6. 🔍 Research Agent       │  → Live data + RAG retrieval + LLM
    │  7. ✍️  Summary Agent       │  → Day-by-day itinerary (LLM)
    │  8. 🌏 Local Tips Agent     │  → Phrases, food, safety tips
    └─────────────────────────────┘
                   │
    ┌──────────────▼──────────────┐
    │   Groq LLaMA 3.1-8B-Instant │  ← All LLM calls (free tier)
    └─────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Streamlit, Custom CSS, Plotly, Folium |
| **AI Inference** | Groq API (llama-3.1-8b-instant) |
| **Embeddings** | HuggingFace `all-MiniLM-L6-v2` (local) |
| **Vector DB** | FAISS (in-memory, per session) |
| **Orchestration** | LangChain (text splitter + document pipeline) |
| **Web Search** | SerpAPI (Google search, hotels, events, images) |
| **Hotels** | MakCorps API |
| **Flights** | AviationStack API |
| **Auth + DB** | Supabase (PostgreSQL + Row Level Security) |
| **Maps** | Folium + Leaflet.js via streamlit-folium |
| **Calendar** | ics (Python) for iCal export |

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/AnishSinghYadav/wandrly-ai-trip-planner.git
cd wandrly-ai-trip-planner
```

### 2. Create a virtual environment

```bash
python -m venv venv
source venv/bin/activate       # macOS/Linux
venv\Scripts\activate          # Windows
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your API keys:

```env
GROQ_API_KEY=your_groq_api_key
SERPAPI_KEY=your_serpapi_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
AVIATIONSTACK_KEY=your_aviationstack_key
MAKCORPS_API_KEY=your_makcorps_key
```

### 5. Set up Supabase database

Run this SQL in your Supabase SQL editor:

```sql
create table trips (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users not null,
  destination text,
  origin text,
  start_date text,
  end_date text,
  members int,
  itinerary text,
  budget_json text,
  local_tips text,
  created_at timestamptz default now()
);

alter table trips enable row level security;

create policy "Users manage own trips" on trips
  for all using (auth.uid() = user_id);
```

### 6. Run the app

```bash
streamlit run app.py
```

Open [http://localhost:8501](http://localhost:8501) in your browser.

---

## 🔑 API Keys (All Free)

| API | Free Tier | Get Key |
|---|---|---|
| **Groq** | 500K tokens/day | [console.groq.com](https://console.groq.com) |
| **SerpAPI** | 100 searches/month | [serpapi.com](https://serpapi.com) |
| **Supabase** | 50K rows, 500MB | [supabase.com](https://supabase.com) |
| **AviationStack** | 500 req/month | [aviationstack.com](https://aviationstack.com) |
| **MakCorps** | 500 req/month | [makcorps.com](https://makcorps.com) |

---

## 📁 Project Structure

```
wandrly-ai-trip-planner/
│
├── app.py                          # Main Streamlit application (~1,900 lines)
├── agents.py                       # All AI agents + data fetchers (~420 lines)
├── auth.py                         # Supabase auth + trip persistence (~130 lines)
├── requirements.txt                # Python dependencies
├── .env.example                    # Environment variable template
│
├── .streamlit/
│   └── config.toml                 # Streamlit configuration
│
├── assets/
│   ├── discover_india.json         # India destinations data
│   └── state_transport.json        # India transport data
│
├── girl travel walk cycle.json     # Lottie hero animation
└── Loading 40 _ Paperplane.json    # Lottie loading animation
```

---

## 🗺️ App Tabs

| Tab | What it does |
|---|---|
| 🗺️ **Plan My Trip** | Main trip planner — enter details, run agents, view itinerary |
| ✨ **Vibe Match** | Get destination suggestions based on mood + budget |
| 🇮🇳 **Explore India** | Curated Indian destinations with one-click planning |
| 🧳 **Pack Smart** | AI packing list with interactive category checklist |
| 🗂️ **Trip History** | View, download, and delete all saved trips |
| ✈️ **Flight Tracker** | Real-time flight status by flight number or route |

---

## ⚡ Performance

| Agent | Typical Time |
|---|---|
| Planner + Booking + Budget | ~10–18s |
| Events + Blog Scraper + RAG build | ~10–25s |
| Research + Summary + Local Tips | ~15–30s |
| **Total pipeline** | **~35–75s** |

---

## 🔮 Roadmap

- [ ] Weather forecast widget (OpenWeatherMap)
- [ ] Live currency converter (INR → local)
- [ ] Google Maps deep links in itinerary
- [ ] Multi-destination trip planning
- [ ] Collaborative trip sharing
- [ ] WhatsApp itinerary export
- [ ] Mobile PWA support

---

## 👨‍💻 Developer

**Anish Singh Yadav**
- GitHub: [@AnishSinghYadav](https://github.com/AnishSinghYadav)
- Email: anishsinghyadav2909@gmail.com

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
Built with ❤️ using Streamlit + Groq + SerpAPI + Supabase
</div>
