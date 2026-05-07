import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowRight, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchIndiaDestinations } from '../../lib/api'
import { useAppStore } from '../../store/useAppStore'
import type { IndiaDestination } from '../../types'

function BudgetBadge({ budget }: { budget: string }) {
  const isHigh = budget.includes('High') || budget.includes('Luxury')
  const isLow = budget.toLowerCase().startsWith('low')
  return (
    <span style={{
      padding: '3px 10px',
      borderRadius: '6px',
      fontSize: '0.7rem',
      fontWeight: 700,
      background: isHigh
        ? 'rgba(196,154,73,0.18)'
        : isLow
        ? 'rgba(60,180,100,0.15)'
        : 'rgba(196,154,73,0.1)',
      border: isHigh
        ? '1px solid rgba(196,154,73,0.4)'
        : isLow
        ? '1px solid rgba(60,180,100,0.3)'
        : '1px solid rgba(196,154,73,0.25)',
      color: isHigh ? 'rgb(var(--gold-bright))' : isLow ? '#6ee7a0' : 'rgb(var(--gold))',
      letterSpacing: '0.04em',
    }}>
      ◈ {budget}
    </span>
  )
}

function DestinationCard({ dest, index }: { dest: IndiaDestination; index: number }) {
  const [hovered, setHovered] = useState(false)
  const setSelectedIndiaDest = useAppStore((s) => s.setSelectedIndiaDest)
  const setActiveTab = useAppStore((s) => s.setActiveTab)

  const handleSelect = () => {
    setSelectedIndiaDest(dest.name + ', India')
    setActiveTab('plan')
    toast.success(`${dest.name} selected! Head to Plan My Trip`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 100, damping: 15 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        borderRadius: '20px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(var(--bg-surface), 0.5)',
        backdropFilter: 'blur(20px)',
        border: hovered
          ? '1px solid rgba(196,154,73,0.4)'
          : '1px solid rgba(196,154,73,0.12)',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 20px 60px rgba(0,0,0,0.35), 0 0 40px rgba(196,154,73,0.1)'
          : '0 4px 20px rgba(0,0,0,0.2)',
      }}
    >
      {/* Gradient header */}
      <div
        style={{
          position: 'relative',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minHeight: '90px',
          background: dest.gradient,
        }}
      >
        {/* Gold shimmer overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(196,154,73,0.08) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <motion.span
          style={{ fontSize: '2.8rem', userSelect: 'none', position: 'relative', zIndex: 1 }}
          animate={hovered ? { scale: 1.15, rotate: [-3, 3, 0] } : { scale: 1, rotate: 0 }}
          transition={{ duration: 0.5 }}
        >
          {dest.emoji}
        </motion.span>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h3 style={{
            fontFamily: 'Playfair Display, serif',
            fontWeight: 700,
            fontSize: '1.2rem',
            color: '#fff',
            letterSpacing: '-0.01em',
            marginBottom: '2px',
          }}>
            {dest.name}
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)', letterSpacing: '0.04em' }}>
            ◇ Best: {dest.season}
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
          <span style={{
            padding: '3px 10px',
            borderRadius: '6px',
            fontSize: '0.7rem',
            fontWeight: 700,
            background: 'rgba(196,154,73,0.12)',
            border: '1px solid rgba(196,154,73,0.3)',
            color: 'rgb(var(--gold))',
            letterSpacing: '0.04em',
          }}>
            ✦ {dest.vibe}
          </span>
          <BudgetBadge budget={dest.budget} />
          <span style={{ fontSize: '0.72rem', color: 'rgb(var(--text-muted))' }}>
            {dest.avg_temp}
          </span>
        </div>

        <p style={{ fontSize: '0.83rem', lineHeight: 1.65, flex: 1, color: 'rgb(var(--text-muted))' }}>
          {dest.description}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {dest.highlights.map((h) => (
            <span key={h} className="lux-pill" style={{ fontSize: '0.68rem', padding: '3px 9px' }}>
              {h}
            </span>
          ))}
        </div>

        <p style={{ fontSize: '0.7rem', color: 'rgb(var(--text-muted))', opacity: 0.7 }}>
          ◎ {dest.language}
        </p>
      </div>

      {/* CTA */}
      <div style={{ padding: '0 1rem 1rem' }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSelect}
          className="btn-luxury"
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '12px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '7px',
            fontFamily: 'DM Sans, sans-serif',
            letterSpacing: '0.06em',
            fontWeight: 600,
          }}
        >
          <MapPin size={13} />
          Plan Trip to {dest.name}
          <ArrowRight size={13} />
        </motion.button>
      </div>
    </motion.div>
  )
}

export default function ExploreIndiaTab() {
  const { data: destinations, isLoading, isError } = useQuery<IndiaDestination[]>({
    queryKey: ['india-destinations'],
    queryFn: fetchIndiaDestinations,
  })

  return (
    <div>
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
            ◇ Incredible India
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
          Discover India
        </h2>
        <p style={{ color: 'rgb(var(--text-muted))', fontSize: '0.9rem', lineHeight: 1.6 }}>
          From golden beaches to Himalayan peaks — India hits different.
        </p>
      </motion.div>

      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3" style={{ gap: '1.25rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                borderRadius: '20px',
                height: '320px',
                background: 'rgba(196,154,73,0.04)',
                border: '1px solid rgba(196,154,73,0.1)',
                animation: `pulse 2s ease-in-out ${i * 0.1}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="lux-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'rgb(var(--text-muted))', fontSize: '0.9rem' }}>
            Could not load destinations — is the backend running?
          </p>
        </div>
      )}

      {destinations && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3" style={{ gap: '1.25rem' }}>
          {destinations.map((dest, i) => (
            <DestinationCard key={dest.name} dest={dest} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
