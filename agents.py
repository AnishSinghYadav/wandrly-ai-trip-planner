import os
import time

from groq import Groq
from serpapi import GoogleSearch
from geopy.geocoders import Nominatim
from bs4 import BeautifulSoup
import requests
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

# ─────────────────────────────────────────────────────────────────────────────
# Groq client
# ─────────────────────────────────────────────────────────────────────────────

def _groq():
    return Groq()

def call_groq_with_retry(model_name, prompt, max_retries=3, json_mode=False):
    client = _groq()
    for attempt in range(max_retries):
        try:
            kwargs = {
                "messages": [{"role": "user", "content": prompt}],
                "model": model_name,
            }
            if json_mode:
                kwargs["response_format"] = {"type": "json_object"}
            resp = client.chat.completions.create(**kwargs)
            return resp.choices[0].message.content
        except Exception as e:
            err = str(e)
            if "429" in err or "503" in err:
                wait = 2 * (attempt + 1)
                print(f"[RATE LIMIT] model={model_name} attempt={attempt+1}/{max_retries} waiting {wait}s | {err[:120]}")
                if attempt < max_retries - 1:
                    time.sleep(wait)
                    continue
            raise e

# ─────────────────────────────────────────────────────────────────────────────
# Raw data helpers (tool implementations)
# ─────────────────────────────────────────────────────────────────────────────

def get_coordinates(destination):
    try:
        geolocator = Nominatim(user_agent="ai_trip_planner")
        location = geolocator.geocode(destination)
        if location:
            return [location.latitude, location.longitude]
    except Exception:
        pass
    return None

def fetch_serpapi_search(query):
    api_key = os.environ.get("SERPAPI_KEY")
    if not api_key:
        return "SerpApi Key not found."
    params = {"engine": "google", "q": query, "api_key": api_key}
    try:
        results = GoogleSearch(params).get_dict()
        snippets = [
            f"- {r.get('title')}: {r.get('snippet')}"
            for r in results.get("organic_results", [])[:5]
        ]
        return "\n".join(snippets) if snippets else "No results found."
    except Exception as e:
        return f"Live search failed: {str(e)}"

def fetch_and_scrape_blogs(destination):
    api_key = os.environ.get("SERPAPI_KEY")
    if not api_key:
        return ""
    params = {
        "engine": "google",
        "q": f"best hidden gems travel blog {destination}",
        "api_key": api_key,
    }
    try:
        results = GoogleSearch(params).get_dict()
        urls = [r.get("link") for r in results.get("organic_results", [])[:3]]
        all_text = ""
        for url in urls:
            try:
                resp = requests.get(url, timeout=5)
                soup = BeautifulSoup(resp.text, "html.parser")
                for p in soup.find_all("p"):
                    all_text += p.get_text() + "\n"
            except Exception:
                pass
        return all_text
    except Exception:
        return ""

def build_vector_db(text):
    if not text.strip():
        return None
    try:
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        docs = [Document(page_content=t) for t in splitter.split_text(text)]
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        return FAISS.from_documents(docs, embeddings)
    except Exception as e:
        print(f"Vector DB Error: {e}")
        return None

def rag_search(query, db, k=3):
    if not db:
        return ""
    try:
        docs = db.similarity_search(query, k=k)
        return "\n\n".join(d.page_content for d in docs)
    except Exception:
        return ""

def fetch_images(destination):
    api_key = os.environ.get("SERPAPI_KEY")
    if not api_key:
        return []
    params = {
        "engine": "google",
        "q": f"{destination} beautiful tourism",
        "tbm": "isch",
        "api_key": api_key,
    }
    try:
        results = GoogleSearch(params).get_dict()
        return [
            img.get("original", "")
            for img in results.get("images_results", [])[:3]
            if img.get("original")
        ]
    except Exception:
        return []

def fetch_events(destination, start_date, end_date):
    api_key = os.environ.get("SERPAPI_KEY")
    if not api_key:
        return "SerpApi Key not found for events."
    try:
        from datetime import datetime
        month_year = datetime.strptime(start_date, "%Y-%m-%d").strftime("%B %Y")
    except Exception:
        month_year = ""
    params = {
        "engine": "google_events",
        "q": f"Events in {destination} {month_year}".strip(),
        "api_key": api_key,
    }
    try:
        results = GoogleSearch(params).get_dict()
        events_list = []
        for ev in results.get("events_results", [])[:4]:
            title = ev.get("title", "Unknown Event")
            date_str = ev.get("date", {}).get("when", "Unknown Date")
            address = ", ".join(ev.get("address", []))
            link = ev.get("link", f"https://www.google.com/search?q={title} {destination}")
            events_list.append(f"- **{title}** | 📅 {date_str} | 📍 {address} | [Info]({link})")
        return "\n".join(events_list) if events_list else "No major events found."
    except Exception as e:
        return f"Events search failed: {str(e)}"

def _search_hotels_raw(destination, check_in, check_out, adults):
    """
    Hotel search — MakCorps API first, falls back to SerpAPI Google Hotels.
    """
    makcorps_key = os.environ.get("MAKCORPS_API_KEY")
    if makcorps_key:
        try:
            url = "https://api.makcorps.com/free/hotel"
            params = {
                "api_key": makcorps_key,
                "name": destination,
                "rooms": 1,
                "adults": adults,
                "checkin": check_in,
                "checkout": check_out,
                "cur": "INR",
            }
            resp = requests.get(url, params=params, timeout=10)
            data = resp.json()
            hotels = []
            for item in (data if isinstance(data, list) else data.get("data", []))[:4]:
                name = item.get("name", item.get("hotel_name", "Unknown Hotel"))
                prices = {k: v for k, v in item.items()
                          if k not in ("name", "hotel_name", "id", "stars", "rating", "image")
                          and isinstance(v, str) and v}
                price_str = " | ".join(f"{ota}: {p}" for ota, p in list(prices.items())[:3]) or "Price N/A"
                rating = item.get("rating", item.get("stars", "N/A"))
                hotels.append(f"- 🏨 **{name}** | ⭐ {rating} | {price_str}")
            if hotels:
                return "\n".join(hotels)
        except Exception as e:
            print(f"MakCorps error: {e}")

    # Fallback: SerpAPI Google Hotels
    serpapi_key = os.environ.get("SERPAPI_KEY")
    if not serpapi_key:
        return "No hotel API key configured."
    params = {
        "engine": "google_hotels",
        "q": destination,
        "check_in_date": check_in,
        "check_out_date": check_out,
        "adults": adults,
        "currency": "INR",
        "api_key": serpapi_key,
    }
    hotels = []
    try:
        results = GoogleSearch(params).get_dict()
        for h in results.get("properties", [])[:3]:
            name = h.get("name", "Unknown Hotel")
            price = h.get("rate_per_night", {}).get("lowest", "Unknown Price")
            rating = h.get("overall_rating", "No rating")
            link = h.get("link", f"https://www.google.com/search?q={name} {destination} hotel")
            hotels.append(f"- 🏨 **{name}** | ⭐ {rating} | Price: {price} | [Book Here]({link})")
    except Exception:
        pass
    return "\n".join(hotels) if hotels else "No hotel properties found."


def _search_flights_raw(origin, destination, departure_date, return_date=None):
    """Flight search via SerpAPI web search."""
    query = f"flights from {origin} to {destination} on {departure_date}"
    if return_date:
        query += f" returning {return_date}"
    return fetch_serpapi_search(query)


def fetch_live_flights(flight_iata=None, dep_iata=None, arr_iata=None, flight_date=None):
    """
    Fetch real-time flight status from AviationStack.
    Pass flight_iata (e.g. 'AI101') for a specific flight,
    or dep_iata + arr_iata for route-level results.
    Returns a list of flight dicts.
    """
    api_key = os.environ.get("AVIATIONSTACK_KEY")
    if not api_key:
        return []
    params = {"access_key": api_key, "limit": 10}
    if flight_iata:
        params["flight_iata"] = flight_iata
    if dep_iata:
        params["dep_iata"] = dep_iata
    if arr_iata:
        params["arr_iata"] = arr_iata
    if flight_date:
        params["flight_date"] = flight_date
    try:
        resp = requests.get("http://api.aviationstack.com/v1/flights", params=params, timeout=8)
        data = resp.json()
        return data.get("data", [])
    except Exception as e:
        print(f"[AviationStack] {e}")
        return []


# ─────────────────────────────────────────────────────────────────────────────
# Public agent functions
# Data is fetched in Python first, then injected into one LLM call.
# No tool-calling loops — avoids Groq free-tier rate limits entirely.
# ─────────────────────────────────────────────────────────────────────────────

def suggester_agent(origin, budget, weather, month):
    prompt = f"""
You are an expert Travel Destination Suggester.
A user wants to travel in {month} from {origin}.
They have a {budget} budget and prefer {weather} weather.

Suggest 3 perfect destinations (cities/countries). For each, provide:
- Destination Name
- Why it matches their criteria
- Estimated flight duration from {origin}
- Typical {month} weather there
Return a beautifully formatted Markdown list.
"""
    return call_groq_with_retry("llama-3.1-8b-instant", prompt)


def planner_agent(origin, destination, start_date, end_date, no_of_members, interests):
    print(f"[planner_agent] model=llama-3.1-8b-instant | fetching live search data for {destination}")
    live_data = fetch_serpapi_search(f"travel guide {destination} visa tips best areas {start_date[:7]}")
    prompt = f"""
You are an expert Trip Planning Orchestrator.
Trip Details:
- Origin: {origin}
- Destination: {destination}
- Dates: {start_date} to {end_date}
- Group Size: {no_of_members} people
- Interests: {interests}

Live web data about the destination:
{live_data}

Based on the above, provide a concise list of 3-5 specific research tasks needed to plan this trip perfectly.
Return ONLY the task list.
"""
    return call_groq_with_retry("llama-3.1-8b-instant", prompt)


def research_agent(task_list, destination, vector_db=None):
    print(f"[research_agent] model=llama-3.1-8b-instant | fetching live + RAG data for {destination}")
    live_data = fetch_serpapi_search(f"top rated restaurants things to do {destination} 2024 google maps ratings")
    blog_text = fetch_and_scrape_blogs(destination)
    rag_context = rag_search(task_list, vector_db, k=4) if vector_db else ""
    prompt = f"""
You are an expert Travel Research Agent.
Research tasks for a trip to {destination}:

{task_list}

Hidden gems from travel blogs:
{blog_text[:3000] if blog_text else "No blog data available."}

RAG knowledge base:
{rag_context if rag_context else "No RAG data available."}

Live search results:
{live_data}

Provide detailed findings for each task. Include hidden gems and local insights.
Format in Markdown with a clear heading for each task.
"""
    return call_groq_with_retry("llama-3.1-8b-instant", prompt)


def booking_agent(origin, destination, start_date, end_date, no_of_members):
    print(f"[booking_agent] fetching hotels + flights for {destination}")
    hotel_str = _search_hotels_raw(destination, start_date, end_date, no_of_members)
    flight_query = f"flights from {origin} to {destination} leaving {start_date} returning {end_date}"
    flights_data = fetch_serpapi_search(flight_query)
    return f"**Hotels:**\n{hotel_str}\n\n**Flight Info (Search Snippets):**\n{flights_data}"


def summary_agent(research_data, booking_data, event_data, start_date, end_date, destination):
    print(f"[summary_agent] model=llama-3.1-8b-instant | building itinerary for {destination}")
    prompt = f"""
You are an expert Travel Summary Agent.
Based on the following research data for a trip to {destination} from {start_date} to {end_date}:

{research_data}

Live Booking Options (Flights & Hotels):
{booking_data}

Live Events happening during the trip:
{event_data}

Create a final, highly structured, day-by-day itinerary.
At the very beginning of the itinerary, provide:
1. "Live Flights & Hotels" section using the live data.
2. "Special Events" section if there are any cool live events.

CRITICAL: For EVERY transition between activities, you must include a Point-to-Point Transport estimate block (e.g., "🚕 15 min via Uber (~₹800 INR)" or "🚇 20 min via Metro").

Format the output beautifully in Markdown, using emojis and clear headings. Make sure to mention exact dates instead of just "Day 1".
"""
    return call_groq_with_retry("llama-3.1-8b-instant", prompt)


def budget_agent(booking_data, no_of_days, no_of_members, destination):
    prompt = f"""
You are an expert Budget Estimator.
Analyze this live booking data for a {no_of_days}-day trip to {destination} for {no_of_members} people:
{booking_data}

Estimate the total trip cost. You MUST return EXACTLY this JSON structure and nothing else:
{{
  "Flights": 50000,
  "Hotels": 60000,
  "Food": 40000,
  "Activities": 20000,
  "Transport": 10000
}}
Provide realistic numerical values (integers) strictly in Indian Rupees (INR). Output ONLY valid JSON.
"""
    return call_groq_with_retry("llama-3.1-8b-instant", prompt, json_mode=True)


def chat_agent(itinerary, chat_history, query):
    prompt = f"""
You are an expert Trip Assistant Chatbot.
Here is the user's generated itinerary:
{itinerary}

Here is the recent chat history:
{chat_history}

User query: "{query}"

Answer the user's query thoughtfully. If they want to change the itinerary, provide the revised part. Keep your response conversational, friendly, and helpful.
"""
    return call_groq_with_retry("llama-3.1-8b-instant", prompt)


def packing_agent(destination, no_of_days, trip_vibe, interests):
    prompt = f"""
You are an expert Travel Packing Assistant.
Create a comprehensive, smart packing list for this trip:
- Destination: {destination}
- Duration: {no_of_days} days
- Trip Vibe: {trip_vibe}
- Interests: {interests}

Return ONLY valid JSON in exactly this structure (no extra text, no markdown):
{{
  "Clothing": ["item 1", "item 2"],
  "Toiletries": ["item 1", "item 2"],
  "Electronics": ["item 1", "item 2"],
  "Documents": ["item 1", "item 2"],
  "Health & Safety": ["item 1", "item 2"],
  "Misc & Comfort": ["item 1", "item 2"]
}}

Be specific to the destination and vibe. Include quantities where helpful (e.g. "T-shirts x5").
"""
    return call_groq_with_retry("llama-3.1-8b-instant", prompt, json_mode=True)


def local_tips_agent(destination):
    prompt = f"""
You are a local travel expert for {destination}.
Provide a concise, useful local guide with:

1. **5 Essential Local Phrases** (with pronunciation guide if non-English)
2. **Cultural Dos & Don'ts** (5 each)
3. **Must-Try Street Foods** (5 items with description)
4. **Safety Tips** (3-4 practical tips)
5. **Hidden Gem** (1 off-the-beaten-path spot tourists miss)

Format using clear Markdown with emojis. Keep it genuine and practical, not touristy.
"""
    return call_groq_with_retry("llama-3.1-8b-instant", prompt)
