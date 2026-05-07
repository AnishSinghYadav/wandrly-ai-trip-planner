import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Rocket } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import toast from 'react-hot-toast'
import confetti from 'canvas-confetti'
import { useAppStore } from '../../store/useAppStore'
import { planTripSSE } from '../../lib/api'
import type { TripFormData } from '../../types'
import type { PlanningState } from '../../types'
import { VIBE_MAP, PAYMENT_TIPS } from '../../types'
import BudgetChart from '../BudgetChart'
import ChatAssistant from '../ChatAssistant'
import MapView from '../MapView'

// ── LOADING OVERLAY ──────────────────────────────────────────────────────────

function LoadingOverlay({ progress, label }: { progress: number; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'rgba(var(--bg-void), 0.94)',
        backdropFilter: 'blur(32px)',
      }}
    >
      {/* Animated rings */}
      <div style={{ position: 'relative', marginBottom: '3rem', width: '160px', height: '160px' }}>
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              borderRadius: '50%',
              border: `1px solid rgba(196,154,73,${0.5 - i * 0.1})`,
              width: `${80 + i * 32}px`,
              height: `${80 + i * 32}px`,
              top: `${-16 * i}px`,
              left: `${-16 * i}px`,
            }}
            animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
            transition={{ duration: 4 + i * 1.2, repeat: Infinity, ease: 'linear' }}
          />
        ))}
        <motion.div
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '72px', height: '72px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(196,154,73,0.2) 0%, transparent 70%)',
            border: '1px solid rgba(196,154,73,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem',
          }}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          ✈️
        </motion.div>
      </div>

      {/* Label */}
      <motion.p
        key={label}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '1.2rem',
          fontWeight: 500,
          color: 'rgb(var(--text-primary))',
          letterSpacing: '0.05em',
          marginBottom: '1.5rem',
        }}
      >
        {label}
      </motion.p>

      {/* Progress bar */}
      <div style={{
        width: '280px', height: '2px',
        background: 'rgba(196,154,73,0.12)',
        borderRadius: '2px', overflow: 'hidden',
        marginBottom: '0.75rem',
      }}>
        <motion.div
          className="lux-progress-fill"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ height: '100%' }}
        />
      </div>

      <p style={{ color: 'rgb(var(--gold))', fontSize: '0.85rem', letterSpacing: '0.1em', fontWeight: 600 }}>
        {progress}%
      </p>

      {/* Tip card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        style={{
          marginTop: '2.5rem',
          background: 'rgba(var(--bg-surface), 0.5)',
          border: '1px solid rgba(196,154,73,0.15)',
          borderRadius: '14px',
          padding: '1rem 1.5rem',
          maxWidth: '380px', textAlign: 'center',
          backdropFilter: 'blur(16px)',
        }}
      >
        <p style={{ fontSize: '0.78rem', color: 'rgb(var(--text-muted))', lineHeight: 1.7 }}>
          ✦ Wandrly scrapes travel blogs + builds a RAG knowledge base tailored to your destination.
        </p>
      </motion.div>
    </motion.div>
  )
}

// ── IMAGE GALLERY ─────────────────────────────────────────────────────────────

function ImageGallery({ images, destination }: { images: string[]; destination: string }) {
  if (!images.length) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'grid', gridTemplateColumns: `repeat(${images.length}, 1fr)`, gap: '12px', marginBottom: '1.5rem' }}
    >
      {images.map((src, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          style={{
            position: 'relative', aspectRatio: '16/9',
            borderRadius: '16px', overflow: 'hidden',
            border: '1px solid rgba(196,154,73,0.15)',
          }}
          className="lux-card"
        >
          <img
            src={src} alt={destination}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }}
            onMouseEnter={(e) => ((e.target as HTMLImageElement).style.transform = 'scale(1.07)')}
            onMouseLeave={(e) => ((e.target as HTMLImageElement).style.transform = 'scale(1)')}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(1,2,12,0.5) 0%, transparent 50%)',
          }} />
          <p style={{
            position: 'absolute', bottom: '10px', left: '14px',
            fontSize: '0.7rem', color: 'rgba(245,240,228,0.8)',
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            ◈ {destination}
          </p>
        </motion.div>
      ))}
    </motion.div>
  )
}

// ── TRIP BANNER ───────────────────────────────────────────────────────────────

function TripBanner({ destination, formData, noDays }: {
  destination: string; formData: TripFormData | null; noDays: number
}) {
  if (!formData) return null
  const d0 = new Date(formData.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  const d1 = new Date(formData.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'linear-gradient(135deg, rgba(196,154,73,0.06) 0%, rgba(100,40,160,0.04) 100%)',
        border: '1px solid rgba(196,154,73,0.2)',
        borderRadius: '18px',
        padding: '1.5rem 2rem',
        marginBottom: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(196,154,73,0.5), transparent)',
      }} />
      <p className="section-label" style={{ marginBottom: '0.4rem' }}>✦ Your Journey Awaits</p>
      <h2 style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: '2rem', fontWeight: 800,
        color: 'rgb(var(--text-primary))',
        marginBottom: '0.4rem',
      }}>
        ✈️ {destination}
      </h2>
      <p style={{ fontSize: '0.85rem', color: 'rgb(var(--text-muted))', letterSpacing: '0.02em' }}>
        {d0} — {d1} &nbsp;·&nbsp; {noDays} nights &nbsp;·&nbsp;
        {formData.noOfMembers} traveller{formData.noOfMembers > 1 ? 's' : ''} &nbsp;·&nbsp; {formData.tripVibe}
      </p>
    </motion.div>
  )
}

// ── RESULT TABS ───────────────────────────────────────────────────────────────

const RESULT_TABS = [
  { id: 'itinerary', label: 'Itinerary',      icon: '◈' },
  { id: 'budget',    label: 'Budget',          icon: '◇' },
  { id: 'map',       label: 'Map',             icon: '◎' },
  { id: 'events',    label: 'Events',          icon: '✦' },
  { id: 'tips',      label: 'Local Tips',      icon: '◆' },
  { id: 'travel',    label: 'Travel Tips',     icon: '◉' },
  { id: 'chat',      label: 'AI Assistant',    icon: '✧' },
]

function ResultSection({ planning, formData, noOfMembers }: {
  planning: PlanningState; formData: TripFormData | null; noOfMembers: number
}) {
  const [activeResult, setActiveResult] = useState('itinerary')
  const { itinerary, budget, events, localTips, coords, destination, noDays, images } = planning

  const handleDownload = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded!')
  }

  const checklist = [
    'Valid passport / ID (6 months validity beyond return)',
    'Travel insurance purchased',
    'Accommodation bookings confirmed',
    'Notify bank of travel dates',
    'Download offline maps',
    'Emergency contacts saved offline',
    'Vaccines / health requirements checked',
    'Local currency or forex card ready',
  ]
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  return (
    <div>
      <ImageGallery images={images} destination={destination} />
      <TripBanner destination={destination} formData={formData} noDays={noDays} />

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
        {RESULT_TABS.map((t) => {
          const active = activeResult === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveResult(t.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.72rem',
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                border: active ? '1px solid rgba(196,154,73,0.35)' : '1px solid rgba(196,154,73,0.1)',
                background: active
                  ? 'linear-gradient(135deg, rgba(196,154,73,0.14), rgba(232,200,120,0.08))'
                  : 'rgba(var(--bg-surface), 0.3)',
                color: active ? 'rgb(var(--text-primary))' : 'rgb(var(--text-muted))',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none',
                fontFamily: 'DM Sans, sans-serif',
                display: 'flex', alignItems: 'center', gap: '6px',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span style={{ color: 'rgb(var(--gold))', fontSize: '0.65rem' }}>{t.icon}</span>
              {t.label}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeResult}
          initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {/* Itinerary */}
          {activeResult === 'itinerary' && (
            <div>
              <div className="lux-card" style={{ padding: '2rem' }}>
                <div className="md-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{itinerary ?? ''}</ReactMarkdown>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '1rem' }}>
                {[
                  { label: '↓ Markdown', action: () => handleDownload(itinerary ?? '', `Wandrly_${destination}.md`, 'text/markdown') },
                  { label: '↓ Calendar', action: () => {
                    const cal = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:✈️ ${destination}\nDTSTART:${formData?.startDate.replace(/-/g,'')}\nDTEND:${formData?.endDate.replace(/-/g,'')}\nEND:VEVENT\nEND:VCALENDAR`
                    handleDownload(cal, 'wandrly_trip.ics', 'text/calendar')
                  }},
                  { label: '◎ WhatsApp', action: () => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`✈️ My trip to ${destination}!\n\n${(itinerary ?? '').slice(0,500)}...`)}`, '_blank') },
                  { label: '◈ Copy', action: () => { navigator.clipboard.writeText(itinerary ?? ''); toast.success('Copied!') } },
                ].map((btn) => (
                  <motion.button
                    key={btn.label}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={btn.action}
                    className="btn-ghost-gold"
                    style={{ padding: '10px', borderRadius: '10px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
                  >
                    {btn.label}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Budget */}
          {activeResult === 'budget' && (
            <BudgetChart budget={budget} noOfMembers={noOfMembers} />
          )}

          {/* Map */}
          {activeResult === 'map' && (
            <MapView coords={coords} destination={destination} />
          )}

          {/* Events */}
          {activeResult === 'events' && (
            <div className="lux-card" style={{ padding: '2rem' }}>
              <p className="section-label" style={{ marginBottom: '1rem' }}>✦ What's Happening</p>
              <div className="md-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{events ?? 'No event data available.'}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Local Tips */}
          {activeResult === 'tips' && (
            <div className="lux-card" style={{ padding: '2rem' }}>
              <div className="md-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{localTips ?? 'No local tips available.'}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Travel Tips */}
          {activeResult === 'travel' && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div className="lux-card" style={{ padding: '1.5rem' }}>
                <p className="section-label" style={{ marginBottom: '1rem' }}>◈ Money & Payment</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {PAYMENT_TIPS.map((tip) => (
                    <motion.div
                      key={tip.title}
                      whileHover={{ x: 4 }}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '12px',
                        padding: '12px',
                        background: 'rgba(var(--bg-surface), 0.4)',
                        border: '1px solid rgba(196,154,73,0.1)',
                        borderRadius: '12px',
                      }}
                    >
                      <span style={{ fontSize: '1.3rem', flexShrink: 0, marginTop: '2px' }}>{tip.icon}</span>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.88rem', color: 'rgb(var(--text-primary))', marginBottom: '2px' }}>
                          {tip.title}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'rgb(var(--text-muted))', lineHeight: 1.6 }}>{tip.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="lux-card" style={{ padding: '1.5rem' }}>
                <p className="section-label" style={{ marginBottom: '1rem' }}>◇ Pre-Trip Checklist</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {checklist.map((item) => (
                    <label key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox" className="lux-checkbox"
                        checked={!!checked[item]}
                        onChange={() => setChecked((p) => ({ ...p, [item]: !p[item] }))}
                        style={{ marginTop: '2px' }}
                      />
                      <span style={{
                        fontSize: '0.86rem', lineHeight: 1.5,
                        color: checked[item] ? 'rgb(var(--text-muted))' : 'rgb(var(--text-secondary))',
                        textDecoration: checked[item] ? 'line-through' : 'none',
                        transition: 'all 0.2s ease',
                      }}>
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chat */}
          {activeResult === 'chat' && (
            <ChatAssistant itinerary={itinerary ?? ''} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ── SIDEBAR FORM ──────────────────────────────────────────────────────────────

function TripSidebar({
  form, setForm, onSubmit, isLoading, selectedIndiaDest,
}: {
  form: TripFormData
  setForm: React.Dispatch<React.SetStateAction<TripFormData>>
  onSubmit: () => void
  isLoading: boolean
  selectedIndiaDest: string
}) {
  useEffect(() => {
    if (selectedIndiaDest) setForm((p) => ({ ...p, destination: selectedIndiaDest }))
  }, [selectedIndiaDest])

  const today = new Date().toISOString().split('T')[0]
  const defaultStart = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  const defaultEnd   = new Date(Date.now() + 37 * 86400000).toISOString().split('T')[0]

  const daysLeft = form.startDate
    ? Math.max(0, Math.round((new Date(form.startDate).getTime() - Date.now()) / 86400000))
    : null

  const [showMore, setShowMore] = useState(false)

  const Divider = () => <div className="lux-divider" />
  const Label = ({ children }: { children: React.ReactNode }) => (
    <span className="lux-label">{children}</span>
  )

  return (
    <aside
      className="lux-sidebar"
      style={{ padding: '1.5rem', position: 'sticky', top: '84px', height: 'fit-content' }}
    >
      {/* Gold top line */}
      <div style={{
        height: '2px', marginBottom: '1.5rem', borderRadius: '2px',
        background: 'linear-gradient(90deg, transparent, rgba(196,154,73,0.7), rgba(232,200,120,0.9), rgba(196,154,73,0.7), transparent)',
      }} />

      <div style={{ marginBottom: '1.25rem' }}>
        <p style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '1.3rem', fontWeight: 600,
          color: 'rgb(var(--text-primary))', letterSpacing: '0.04em',
          marginBottom: '4px',
        }}>
          Plan Your Journey
        </p>
        <p style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))' }}>
          Fill in the details — our AI agents handle the rest.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Destinations */}
        <div>
          <p className="section-label">◈ Where To?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <Label>From</Label>
              <input className="lux-input" value={form.origin}
                onChange={(e) => setForm((p) => ({ ...p, origin: e.target.value }))}
                placeholder="e.g. New Delhi, India" />
            </div>
            <div>
              <Label>To</Label>
              <input className="lux-input" value={form.destination}
                onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))}
                placeholder="e.g. Tokyo, Japan" />
            </div>
          </div>
        </div>

        <Divider />

        {/* Dates */}
        <div>
          <p className="section-label">◇ When?</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <Label>Departure</Label>
              <input type="date" className="lux-input" min={today}
                value={form.startDate || defaultStart}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
            </div>
            <div>
              <Label>Return</Label>
              <input type="date" className="lux-input" min={form.startDate || today}
                value={form.endDate || defaultEnd}
                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} />
            </div>
          </div>

          {daysLeft !== null && daysLeft > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="countdown-box"
              style={{ marginTop: '10px' }}
            >
              <span style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '3rem', fontWeight: 800,
                display: 'block', lineHeight: 1,
                background: 'linear-gradient(135deg, rgb(var(--gold)), rgb(var(--gold-bright)))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {daysLeft}
              </span>
              <span style={{
                fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase',
                color: 'rgb(var(--text-muted))', marginTop: '4px', display: 'block',
              }}>
                Days Until Departure
              </span>
            </motion.div>
          )}
          {daysLeft === 0 && (
            <div className="countdown-box" style={{ marginTop: '10px' }}>
              <span style={{ fontSize: '2rem', display: 'block' }}>✈️</span>
              <span style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgb(var(--gold))' }}>
                Today's The Day — Bon Voyage!
              </span>
            </div>
          )}
        </div>

        <Divider />

        {/* Travellers */}
        <div>
          <p className="section-label">◎ Travellers</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="number" className="lux-input" min={1} max={50}
              value={form.noOfMembers}
              onChange={(e) => setForm((p) => ({ ...p, noOfMembers: parseInt(e.target.value) || 1 }))}
              style={{ width: '80px' }}
            />
            <span style={{ fontSize: '0.82rem', color: 'rgb(var(--text-muted))' }}>guests</span>
          </div>
        </div>

        <Divider />

        {/* Vibe */}
        <div>
          <p className="section-label">✦ Trip Vibe</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.keys(VIBE_MAP).map((v) => (
              <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input type="radio" className="lux-radio" name="vibe" value={v}
                  checked={form.tripVibe === v}
                  onChange={() => setForm((p) => ({ ...p, tripVibe: v, interests: VIBE_MAP[v] }))} />
                <span style={{
                  fontSize: '0.84rem',
                  color: form.tripVibe === v ? 'rgb(var(--text-primary))' : 'rgb(var(--text-muted))',
                  fontWeight: form.tripVibe === v ? 500 : 400,
                  transition: 'color 0.15s ease',
                }}>
                  {v}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Advanced toggle */}
        <button
          onClick={() => setShowMore((p) => !p)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'rgb(var(--gold))', background: 'none', border: 'none',
            cursor: 'pointer', padding: 0, fontFamily: 'DM Sans, sans-serif',
          }}
        >
          <Zap size={11} />
          {showMore ? 'Hide' : 'Advanced options'}
        </button>

        <AnimatePresence>
          {showMore && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <div>
                <Label>Interests</Label>
                <textarea className="lux-textarea" value={form.interests}
                  onChange={(e) => setForm((p) => ({ ...p, interests: e.target.value }))}
                  placeholder="e.g. street food, photography, hiking..." />
              </div>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                {[
                  { label: 'Veg Only 🥗',         key: 'onlyVeg' as const },
                  { label: 'Religious Sites 🛕',   key: 'religious' as const },
                ].map(({ label, key }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" className="lux-checkbox"
                      checked={form[key] as boolean}
                      onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))} />
                    <span style={{ fontSize: '0.82rem', color: 'rgb(var(--text-muted))' }}>{label}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={onSubmit}
          disabled={isLoading}
          className="btn-luxury"
          style={{
            width: '100%', padding: '14px', borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            cursor: isLoading ? 'wait' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          <Rocket size={16} />
          {isLoading ? 'Planning Your Journey…' : 'Plan My Journey'}
        </motion.button>
      </div>
    </aside>
  )
}

// ── EMPTY STATE ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '500px', textAlign: 'center',
        padding: '3rem',
      }}
      className="lux-card"
    >
      <motion.div
        animate={{ y: [0, -12, 0], rotate: [0, -2, 2, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ fontSize: '5rem', marginBottom: '1.5rem' }}
      >
        ✈️
      </motion.div>

      <h3 style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: '1.8rem', fontWeight: 700,
        color: 'rgb(var(--text-primary))', marginBottom: '0.75rem',
      }}>
        Ready to Explore?
      </h3>
      <p style={{ fontSize: '0.88rem', color: 'rgb(var(--text-muted))', maxWidth: '360px', lineHeight: 1.7 }}>
        Fill in your journey details and let our{' '}
        <span style={{ color: 'rgb(var(--gold))' }}>6 AI agents</span>{' '}
        craft a bespoke itinerary, budget breakdown, and curated experiences — in minutes.
      </p>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px', marginTop: '2.5rem', width: '100%', maxWidth: '400px',
      }}>
        {[
          { icon: '✦', label: 'Planner Agent' },
          { icon: '◎', label: 'Research Agent' },
          { icon: '◈', label: 'Summary Agent' },
          { icon: '◇', label: 'Budget Agent' },
          { icon: '◆', label: 'Booking Agent' },
          { icon: '◉', label: 'Packing Agent' },
        ].map((a, i) => (
          <motion.div
            key={a.label}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 + 0.3 }}
            style={{
              background: 'rgba(var(--bg-surface), 0.5)',
              border: '1px solid rgba(196,154,73,0.12)',
              borderRadius: '10px', padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            <span style={{ color: 'rgb(var(--gold))', fontSize: '0.7rem' }}>{a.icon}</span>
            <span style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))', letterSpacing: '0.04em' }}>
              {a.label}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

export default function PlanTripTab() {
  const { planning, setPlanningField, resetPlanning, clearChat, selectedIndiaDest } = useAppStore()

  const [form, setForm] = useState<TripFormData>({
    origin: 'New Delhi, India',
    destination: 'Tokyo, Japan',
    startDate: '', endDate: '',
    noOfMembers: 2,
    interests: VIBE_MAP['Adventure 🏔️'],
    tripVibe: 'Adventure 🏔️',
    onlyVeg: false, religious: false,
  })

  const handlePlanTrip = async () => {
    if (!form.startDate || !form.endDate) { toast.error('Please select your travel dates.'); return }
    if (!form.destination.trim()) { toast.error('Please enter a destination.'); return }

    resetPlanning(); clearChat()
    setPlanningField('isLoading', true)
    setPlanningField('destination', form.destination)
    setPlanningField('formData', form)

    try {
      await planTripSSE(form, {
        onProgress: (pct, label) => { setPlanningField('progress', pct); setPlanningField('progressLabel', label) },
        onImages:   (imgs) => setPlanningField('images', imgs),
        onBudget:   (b)    => setPlanningField('budget', b),
        onDone: (data) => {
          setPlanningField('itinerary', data.itinerary)
          setPlanningField('events', data.events)
          setPlanningField('localTips', data.localTips)
          setPlanningField('coords', data.coords)
          setPlanningField('noDays', data.noDays)
          setPlanningField('isLoading', false)
          setPlanningField('progress', 100)
          confetti({
            particleCount: 200, spread: 90,
            origin: { y: 0.55 },
            colors: ['#C49A49', '#E8C878', '#F5F0E4', '#c45070', '#8040b4'],
          })
          toast.success(`Your ${form.destination} journey is ready! ✦`)
        },
        onError: (msg) => {
          setPlanningField('error', msg)
          setPlanningField('isLoading', false)
          toast.error(msg.includes('429') ? 'Rate limit — please wait a moment.' : `Error: ${msg.slice(0, 80)}`)
        },
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setPlanningField('error', msg)
      setPlanningField('isLoading', false)
      toast.error('Could not connect to API. Is the backend running?')
    }
  }

  return (
    <div>
      <AnimatePresence>
        {planning.isLoading && (
          <LoadingOverlay progress={planning.progress} label={planning.progressLabel} />
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>
        <TripSidebar
          form={form} setForm={setForm}
          onSubmit={handlePlanTrip}
          isLoading={planning.isLoading}
          selectedIndiaDest={selectedIndiaDest}
        />
        <div style={{ minHeight: '500px' }}>
          {planning.itinerary
            ? <ResultSection planning={planning} formData={planning.formData} noOfMembers={form.noOfMembers} />
            : !planning.isLoading && <EmptyState />
          }
        </div>
      </div>
    </div>
  )
}
