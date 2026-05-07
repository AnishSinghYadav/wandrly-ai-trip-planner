import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

const DESTINATIONS = [
  { name: 'Santorini',    emoji: '🏛️', sub: 'Greece' },
  { name: 'Kyoto',        emoji: '⛩️', sub: 'Japan' },
  { name: 'Amalfi',       emoji: '🌊', sub: 'Italy' },
  { name: 'Maldives',     emoji: '🌴', sub: 'Indian Ocean' },
  { name: 'Rajasthan',    emoji: '🏰', sub: 'India' },
]

const PILLS = [
  { label: '6 AI Agents',            icon: '✦' },
  { label: 'Live Flights & Hotels',   icon: '◈' },
  { label: 'RAG-Powered Research',    icon: '◎' },
  { label: 'Intelligent Packing',     icon: '◇' },
]

/* ── Floating destination cards ── */
function FloatingCard({ name, emoji, sub, delay, style }: {
  name: string; emoji: string; sub: string; delay: number
  style: React.CSSProperties
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 80, damping: 14 }}
      style={{
        position: 'absolute',
        ...style,
        background: 'rgba(var(--bg-surface), 0.55)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(196,154,73,0.18)',
        borderRadius: '14px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(196,154,73,0.08)',
        animation: `float-luxury ${6 + delay}s ease-in-out ${delay}s infinite`,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: '1.2rem' }}>{emoji}</span>
      <div>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgb(var(--text-primary))' }}>
          {name}
        </div>
        <div style={{ fontSize: '0.65rem', color: 'rgb(var(--gold))', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {sub}
        </div>
      </div>
    </motion.div>
  )
}

export default function HeroSection() {
  const chars = 'WANDRLY'.split('')

  const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
  }
  const char = {
    hidden: { opacity: 0, y: 60, rotateX: -40 },
    visible: {
      opacity: 1, y: 0, rotateX: 0,
      transition: { type: 'spring', stiffness: 120, damping: 14 },
    },
  }

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '5rem 1.5rem 4rem',
      }}
    >
      {/* Horizontal gold lines */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(196,154,73,0.25), transparent)',
      }} />

      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>

          {/* ── Left: Text ── */}
          <div>
            {/* Overline */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ height: '1px', width: '40px', background: 'rgb(var(--gold))', opacity: 0.6 }} />
              <span style={{
                fontSize: '0.62rem',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'rgb(var(--gold))',
                fontWeight: 600,
              }}>
                AI-Powered Travel Intelligence
              </span>
              <div style={{ height: '1px', flex: 1, background: 'rgba(196,154,73,0.2)' }} />
            </motion.div>

            {/* Main title — character stagger */}
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
              style={{
                display: 'flex',
                gap: '0.02em',
                marginBottom: '0.2rem',
                perspective: '600px',
              }}
            >
              {chars.map((c, i) => (
                <motion.span
                  key={i}
                  variants={char}
                  style={{
                    fontFamily: 'Playfair Display, serif',
                    fontSize: 'clamp(4rem, 8vw, 7.5rem)',
                    fontWeight: 800,
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                    display: 'inline-block',
                    background: `linear-gradient(
                      160deg,
                      rgb(var(--gold-muted)) 0%,
                      rgb(var(--gold-bright)) ${30 + i * 6}%,
                      rgb(var(--cream)) 55%,
                      rgb(var(--gold-bright)) 75%,
                      rgb(var(--gold)) 100%
                    )`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {c}
                </motion.span>
              ))}
            </motion.div>

            {/* Italic subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
                fontStyle: 'italic',
                fontWeight: 300,
                color: 'rgb(var(--text-secondary))',
                marginBottom: '1.2rem',
                letterSpacing: '0.03em',
              }}
            >
              Plan it. Vibe it.{' '}
              <em style={{ color: 'rgb(var(--gold))', fontStyle: 'italic' }}>Live it.</em>
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 }}
              style={{
                fontSize: '0.9rem',
                color: 'rgb(var(--text-muted))',
                lineHeight: 1.7,
                maxWidth: '420px',
                marginBottom: '2.2rem',
              }}
            >
              Multi-agent AI that researches, plans, books and packs for your next luxury adventure — in minutes.
            </motion.p>

            {/* Stat pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
            >
              {PILLS.map((p, i) => (
                <motion.span
                  key={p.label}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 + i * 0.08 }}
                  whileHover={{ scale: 1.04, y: -2 }}
                  className="lux-pill"
                >
                  <span style={{ color: 'rgb(var(--gold))', fontSize: '0.7rem' }}>{p.icon}</span>
                  {p.label}
                </motion.span>
              ))}
            </motion.div>
          </div>

          {/* ── Right: Floating destination cards ── */}
          <div
            className="hidden lg:block"
            style={{
              position: 'relative',
              height: '380px',
            }}
          >
            {/* Central decorative circle */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 80 }}
              style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '160px', height: '160px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(196,154,73,0.12) 0%, rgba(196,154,73,0.03) 60%, transparent 100%)',
                border: '1px solid rgba(196,154,73,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 60px rgba(196,154,73,0.1)',
              }}
            >
              {/* Outer ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute', inset: '-20px',
                  border: '1px dashed rgba(196,154,73,0.15)',
                  borderRadius: '50%',
                }}
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute', inset: '-40px',
                  border: '1px dashed rgba(196,154,73,0.08)',
                  borderRadius: '50%',
                }}
              />
              <span style={{ fontSize: '3rem', animation: 'float-luxury 6s ease-in-out infinite' }}>✈️</span>
            </motion.div>

            {/* Floating cards */}
            <FloatingCard {...DESTINATIONS[0]} delay={0.5} style={{ top: '2%',  left: '10%'  }} />
            <FloatingCard {...DESTINATIONS[1]} delay={0.7} style={{ top: '12%', right: '2%'  }} />
            <FloatingCard {...DESTINATIONS[2]} delay={0.9} style={{ bottom: '22%', left: '0%'   }} />
            <FloatingCard {...DESTINATIONS[3]} delay={1.1} style={{ bottom: '5%', right: '8%'  }} />
            <FloatingCard {...DESTINATIONS[4]} delay={1.3} style={{ top: '42%', right: '0%'   }} />
          </div>
        </div>
      </div>

      {/* Bottom gold rule */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(196,154,73,0.18), transparent)',
      }} />
    </div>
  )
}
