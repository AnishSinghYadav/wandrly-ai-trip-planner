import type { BudgetData, PlanningState, TripFormData } from '../types'

const BASE = '/api'

// ── SSE plan trip ─────────────────────────────────────────────────────────────

type SSEEvent =
  | { event: 'progress'; pct: number; label: string }
  | { event: 'images'; images: string[] }
  | { event: 'budget'; budget: BudgetData | null }
  | { event: 'done'; itinerary: string; events: string; local_tips: string; coords: [number,number] | null; no_of_days: number }
  | { event: 'error'; message: string }

type PlanCallbacks = {
  onProgress?: (pct: number, label: string) => void
  onImages?: (imgs: string[]) => void
  onBudget?: (b: BudgetData | null) => void
  onDone?: (data: Omit<PlanningState, 'isLoading' | 'progress' | 'progressLabel' | 'images' | 'budget' | 'error' | 'formData' | 'destination'>) => void
  onError?: (msg: string) => void
}

export async function planTripSSE(form: TripFormData, cb: PlanCallbacks): Promise<void> {
  const resp = await fetch(`${BASE}/plan-trip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin: form.origin,
      destination: form.destination,
      start_date: form.startDate,
      end_date: form.endDate,
      no_of_members: form.noOfMembers,
      interests: form.interests,
      trip_vibe: form.tripVibe,
      only_veg: form.onlyVeg,
      religious: form.religious,
    }),
  })

  if (!resp.ok) throw new Error(`Server error: ${resp.status}`)
  if (!resp.body) throw new Error('No response body')

  const reader = resp.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const data = JSON.parse(line.slice(6)) as SSEEvent
        if (data.event === 'progress') cb.onProgress?.(data.pct, data.label)
        else if (data.event === 'images') cb.onImages?.(data.images)
        else if (data.event === 'budget') cb.onBudget?.(data.budget)
        else if (data.event === 'done')
          cb.onDone?.({
            itinerary: data.itinerary,
            events: data.events,
            localTips: data.local_tips,
            coords: data.coords,
            noDays: data.no_of_days,
          })
        else if (data.event === 'error') cb.onError?.(data.message)
      } catch {}
    }
  }
}

// ── Regular endpoints ─────────────────────────────────────────────────────────

export async function fetchSuggestions(params: {
  origin: string; budget: string; weather: string; month: string
}): Promise<string> {
  const r = await fetch(`${BASE}/suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const data = await r.json()
  return data.result as string
}

export async function fetchPackingList(params: {
  destination: string; no_of_days: number; trip_vibe: string; interests: string
}): Promise<Record<string, string[]>> {
  const r = await fetch(`${BASE}/packing-list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const data = await r.json()
  return data.result
}

export async function fetchChat(params: {
  itinerary: string; chat_history: string; query: string
}): Promise<string> {
  const r = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const data = await r.json()
  return data.result as string
}

export async function fetchLocalTips(destination: string): Promise<string> {
  const r = await fetch(`${BASE}/local-tips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ destination }),
  })
  const data = await r.json()
  return data.result as string
}

export async function fetchIndiaDestinations() {
  const r = await fetch(`${BASE}/india-destinations`)
  return r.json()
}
