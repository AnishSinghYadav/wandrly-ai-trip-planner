import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { TabId } from '../types'

const TABS: { id: TabId; label: string; short: string }[] = [
  { id: 'plan',  label: 'Plan My Trip',    short: 'Plan' },
  { id: 'vibe',  label: 'Vibe Match',      short: 'Vibe' },
  { id: 'india', label: 'Explore India',   short: 'India' },
  { id: 'pack',  label: 'Pack Smart',      short: 'Pack' },
]

export default function Navbar() {
  const { theme, toggleTheme, activeTab, setActiveTab } = useAppStore()

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(var(--bg-void), 0.75)',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        borderBottom: '1px solid rgba(196,154,73,0.1)',
      }}
    >
      {/* Thin gold top accent */}
      <div
        style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(196,154,73,0.6), rgba(232,200,120,0.8), rgba(196,154,73,0.6), transparent)',
        }}
      />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>

          {/* Logo */}
          <motion.div
            onClick={() => setActiveTab('plan')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none' }}
          >
            {/* Diamond icon */}
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: '34px', height: '34px',
                background: 'linear-gradient(135deg, rgba(196,154,73,0.9), rgba(232,200,120,0.95), rgba(196,154,73,0.9))',
                borderRadius: '8px',
                transform: 'rotate(45deg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px rgba(196,154,73,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
                flexShrink: 0,
              }}
            >
              <span style={{ transform: 'rotate(-45deg)', fontSize: '14px' }}>✦</span>
            </motion.div>

            <div>
              <div
                style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  lineHeight: 1,
                }}
                className="text-gold-shimmer"
              >
                Wandrly
              </div>
              <div style={{
                fontSize: '0.52rem',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'rgb(var(--text-muted))',
                lineHeight: 1,
                marginTop: '2px',
              }}>
                Luxury AI Travel
              </div>
            </div>
          </motion.div>

          {/* Desktop tabs */}
          <div
            className="hidden sm:flex"
            style={{
              alignItems: 'center',
              gap: '2px',
              background: 'rgba(var(--bg-surface), 0.4)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(196,154,73,0.1)',
              borderRadius: '14px',
              padding: '5px',
            }}
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    position: 'relative',
                    padding: '7px 18px',
                    borderRadius: '10px',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    transition: 'color 0.2s ease',
                    color: active ? 'rgb(var(--text-primary))' : 'rgb(var(--text-muted))',
                    outline: 'none',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, rgba(196,154,73,0.15), rgba(232,200,120,0.1))',
                        border: '1px solid rgba(196,154,73,0.3)',
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span style={{ position: 'relative', zIndex: 1 }}>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Theme toggle */}
          <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9, rotate: 15 }}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            style={{
              width: '38px', height: '38px',
              borderRadius: '10px',
              border: '1px solid rgba(196,154,73,0.2)',
              background: 'rgba(196,154,73,0.06)',
              backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              flexShrink: 0,
            }}
          >
            <AnimatePresence mode="wait">
              {theme === 'dark' ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.22 }}
                >
                  <Sun size={16} style={{ color: 'rgb(var(--gold))' }} />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.22 }}
                >
                  <Moon size={16} style={{ color: 'rgb(var(--gold))' }} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Mobile tabs */}
        <div
          className="sm:hidden"
          style={{
            display: 'flex', gap: '4px', paddingBottom: '10px',
            overflowX: 'auto',
          }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  border: active ? '1px solid rgba(196,154,73,0.35)' : '1px solid transparent',
                  background: active ? 'rgba(196,154,73,0.1)' : 'transparent',
                  color: active ? 'rgb(var(--text-primary))' : 'rgb(var(--text-muted))',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {tab.short}
              </button>
            )
          })}
        </div>
      </div>
    </motion.nav>
  )
}
