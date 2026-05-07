import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Sparkles, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchSuggestions } from '../../lib/api'
import { useAppStore } from '../../store/useAppStore'

const BUDGETS = ['Low (Backpacker)', 'Medium (Standard)', 'High (Luxury)', 'Ultra Luxury 💎']
const WEATHERS = [
  'Sunny & Tropical 🏖️',
  'Mild & Pleasant ⛅',
  'Cold & Snowy ❄️',
  'Desert Heat 🏜️',
  'Misty & Green 🌿',
]
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const STYLES = [
  'Adventure','Beach','Culture & History','Food & Culinary','Nightlife',
  'Nature','Wellness','Budget','Luxury','Solo','Family','Romantic',
]

const STYLE_ICONS: Record<string, string> = {
  Adventure: '◈', Beach: '◎', 'Culture & History': '◇', 'Food & Culinary': '✦',
  Nightlife: '◆', Nature: '◉', Wellness: '✧', Budget: '◈', Luxury: '◇',
  Solo: '◎', Family: '✦', Romantic: '◆',
}

export default function VibeMatchTab() {
  const [origin, setOrigin] = useState('New Delhi, India')
  const [budget, setBudget] = useState(BUDGETS[1])
  const [weather, setWeather] = useState(WEATHERS[0])
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()])
  const [styles, setStyles] = useState<string[]>(['Culture & History', 'Food & Culinary'])
  const [result, setResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const toggleStyle = (s: string) =>
    setStyles((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))

  const handleFind = async () => {
    setIsLoading(true)
    setResult('')
    try {
      const r = await fetchSuggestions({ origin, budget, weather, month })
      setResult(r)
    } catch {
      toast.error('Could not fetch suggestions — is the backend running?')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '2.5rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.75rem' }}>
          <div style={{ height: '1px', width: '32px', background: 'rgb(var(--gold))', opacity: 0.6 }} />
          <span style={{
            fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase',
            color: 'rgb(var(--gold))', fontWeight: 600,
          }}>
            ◎ AI Destination Matcher
          </span>
        </div>
        <h2 style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
          fontWeight: 800,
          color: 'rgb(var(--text-primary))',
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em',
        }}>
          Where should you go?
        </h2>
        <p style={{ color: 'rgb(var(--text-muted))', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Answer 4 quick questions and our AI finds your perfect match.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Left column */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lux-card"
          style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          <div>
            <label className="lux-label">✦ Flying from</label>
            <input
              className="lux-input"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g. Mumbai, India"
            />
          </div>

          <div>
            <label className="lux-label">◈ Budget level</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {BUDGETS.map((b) => (
                <motion.button
                  key={b}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setBudget(b)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    fontFamily: 'DM Sans, sans-serif',
                    background: budget === b
                      ? 'linear-gradient(135deg, rgba(196,154,73,0.18), rgba(196,154,73,0.08))'
                      : 'rgba(196,154,73,0.03)',
                    border: budget === b
                      ? '1px solid rgba(196,154,73,0.45)'
                      : '1px solid rgba(196,154,73,0.12)',
                    color: budget === b ? 'rgb(var(--text-primary))' : 'rgb(var(--text-muted))',
                  }}
                >
                  {b}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right column */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="lux-card"
          style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          <div>
            <label className="lux-label">◇ Preferred weather</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {WEATHERS.map((w) => (
                <label key={w} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="weather"
                    className="lux-radio"
                    checked={weather === w}
                    onChange={() => setWeather(w)}
                  />
                  <span style={{
                    fontSize: '0.85rem',
                    color: weather === w ? 'rgb(var(--text-primary))' : 'rgb(var(--text-muted))',
                    transition: 'color 0.2s',
                  }}>
                    {w}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="lux-label">◉ Travel month</label>
            <select className="lux-select" value={month} onChange={(e) => setMonth(e.target.value)}>
              {MONTHS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
        </motion.div>
      </div>

      {/* Travel style chips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="lux-card"
        style={{ padding: '1.5rem', marginBottom: '1.5rem' }}
      >
        <label className="lux-label" style={{ display: 'block', marginBottom: '1rem' }}>
          ✦ Travel style (pick all that apply)
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {STYLES.map((s) => {
            const active = styles.includes(s)
            return (
              <motion.button
                key={s}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => toggleStyle(s)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '100px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  fontFamily: 'DM Sans, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: active
                    ? 'linear-gradient(135deg, rgba(196,154,73,0.22), rgba(196,154,73,0.1))'
                    : 'rgba(196,154,73,0.04)',
                  border: active
                    ? '1px solid rgba(196,154,73,0.5)'
                    : '1px solid rgba(196,154,73,0.12)',
                  color: active ? 'rgb(var(--gold-bright))' : 'rgb(var(--text-muted))',
                  boxShadow: active ? '0 0 12px rgba(196,154,73,0.15)' : 'none',
                }}
              >
                <span style={{ fontSize: '0.65rem', color: 'rgb(var(--gold))', opacity: active ? 1 : 0.5 }}>
                  {STYLE_ICONS[s] ?? '◈'}
                </span>
                {s}
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.button
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleFind}
        disabled={isLoading}
        className="btn-luxury"
        style={{
          width: '100%',
          padding: '1.1rem',
          borderRadius: '14px',
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '2rem',
          cursor: isLoading ? 'wait' : 'pointer',
          fontFamily: 'Cormorant Garamond, serif',
          fontWeight: 700,
          letterSpacing: '0.06em',
        }}
      >
        {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
        {isLoading ? 'Scanning the globe…' : 'Find My Perfect Destination'}
      </motion.button>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
          >
            <div
              className="lux-card gold-border-glow"
              style={{
                padding: '1.75rem',
                marginBottom: '1rem',
                background: 'linear-gradient(135deg, rgba(196,154,73,0.06), rgba(196,154,73,0.02))',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
                <div style={{ height: '1px', width: '28px', background: 'rgb(var(--gold))', opacity: 0.6 }} />
                <span style={{
                  fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase',
                  color: 'rgb(var(--gold))', fontWeight: 600,
                }}>
                  ✦ Your Perfect Matches
                </span>
              </div>
              <div className="md-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lux-card"
              style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <span style={{ fontSize: '1.5rem' }}>◎</span>
              <p style={{ fontSize: '0.88rem', color: 'rgb(var(--text-muted))', lineHeight: 1.6 }}>
                Found your vibe?{' '}
                <button
                  style={{
                    color: 'rgb(var(--gold))',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                  }}
                  onClick={() => {
                    useAppStore.getState().setActiveTab('plan')
                    toast.success('Go to Plan My Trip and enter your destination!')
                  }}
                >
                  Head to Plan My Trip
                </button>
                {' '}and let's build the full itinerary.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
