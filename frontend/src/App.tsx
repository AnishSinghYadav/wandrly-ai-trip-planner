import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from './store/useAppStore'
import Navbar from './components/Navbar'
import ParticleField from './components/ParticleField'
import HeroSection from './components/HeroSection'
import PlanTripTab from './components/tabs/PlanTripTab'
import VibeMatchTab from './components/tabs/VibeMatchTab'
import ExploreIndiaTab from './components/tabs/ExploreIndiaTab'
import PackSmartTab from './components/tabs/PackSmartTab'

const tabVariants = {
  initial: { opacity: 0, y: 28, filter: 'blur(8px)' },
  animate: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 80, damping: 18 },
  },
  exit: {
    opacity: 0, y: -16, filter: 'blur(4px)',
    transition: { duration: 0.22 },
  },
}

/* ── Animated gold blob background ──────────────────────────────────────── */
function LuxuryBlobs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* blob 1 — gold, top-right */}
      <div
        className="absolute rounded-full"
        style={{
          width: 700, height: 700,
          top: '-20%', right: '-15%',
          background: 'radial-gradient(circle, rgba(196,154,73,0.14) 0%, rgba(196,154,73,0.05) 50%, transparent 70%)',
          filter: 'blur(70px)',
          animation: 'blob-drift-1 18s ease-in-out infinite',
        }}
      />
      {/* blob 2 — deep purple, bottom-left */}
      <div
        className="absolute rounded-full"
        style={{
          width: 800, height: 800,
          bottom: '-25%', left: '-20%',
          background: 'radial-gradient(circle, rgba(100,40,180,0.1) 0%, rgba(60,20,120,0.05) 50%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'blob-drift-2 24s ease-in-out infinite',
        }}
      />
      {/* blob 3 — rose, center */}
      <div
        className="absolute rounded-full"
        style={{
          width: 500, height: 500,
          top: '40%', left: '35%',
          background: 'radial-gradient(circle, rgba(196,80,100,0.07) 0%, transparent 65%)',
          filter: 'blur(60px)',
          animation: 'blob-drift-3 20s ease-in-out infinite',
        }}
      />
      {/* blob 4 — midnight blue, top-left */}
      <div
        className="absolute rounded-full"
        style={{
          width: 600, height: 600,
          top: '5%', left: '-10%',
          background: 'radial-gradient(circle, rgba(30,50,160,0.09) 0%, transparent 65%)',
          filter: 'blur(75px)',
          animation: 'blob-drift-4 28s ease-in-out infinite',
        }}
      />
      {/* blob 5 — gold, bottom-right */}
      <div
        className="absolute rounded-full"
        style={{
          width: 400, height: 400,
          bottom: '5%', right: '5%',
          background: 'radial-gradient(circle, rgba(196,154,73,0.09) 0%, transparent 65%)',
          filter: 'blur(55px)',
          animation: 'blob-drift-1 22s ease-in-out infinite reverse',
        }}
      />
    </div>
  )
}

/* ── Noise grain overlay ─────────────────────────────────────────────────── */
function GrainOverlay() {
  return <div className="grain-overlay" />
}

/* ── Aurora top glow ─────────────────────────────────────────────────────── */
function AuroraTop() {
  return <div className="aurora-top" />
}

/* ── Subtle grid lines ───────────────────────────────────────────────────── */
function GridLines() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(196,154,73,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(196,154,73,0.025) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px',
      }}
    />
  )
}

export default function App() {
  const { theme, activeTab } = useAppStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className="min-h-screen bg-void relative transition-bg duration-500">
      {/* Background layers — z-index 0 */}
      <AuroraTop />
      <LuxuryBlobs />
      <GridLines />
      <ParticleField />
      <GrainOverlay />

      {/* Content — z-index 10+ */}
      <div className="relative z-10">
        <Navbar />
        <HeroSection />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          {/* Gold accent line */}
          <div
            className="h-px mb-10 bg-gradient-to-r from-transparent via-gold/30 to-transparent"
          />

          {/* Gold accent line */}
          <div
            style={{
              height: '1px',
              marginBottom: '2.5rem',
              background: 'linear-gradient(90deg, transparent, rgba(196,154,73,0.3), rgba(196,154,73,0.5), rgba(196,154,73,0.3), transparent)',
            }}
          />

          <AnimatePresence mode="wait">
            {activeTab === 'plan' && (
              <motion.div key="plan" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                <PlanTripTab />
              </motion.div>
            )}
            {activeTab === 'vibe' && (
              <motion.div key="vibe" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                <VibeMatchTab />
              </motion.div>
            )}
            {activeTab === 'india' && (
              <motion.div key="india" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                <ExploreIndiaTab />
              </motion.div>
            )}
            {activeTab === 'pack' && (
              <motion.div key="pack" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                <PackSmartTab />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer
          style={{
            borderTop: '1px solid rgba(196,154,73,0.1)',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'rgb(var(--text-muted))', fontSize: '0.78rem', letterSpacing: '0.08em' }}>
            ✦ WANDRLY &nbsp;·&nbsp; LUXURY AI TRAVEL INTELLIGENCE &nbsp;·&nbsp;
            <span style={{ color: 'rgb(var(--gold))' }}>Powered by Groq + Multi-Agent AI</span>
          </p>
        </footer>
      </div>
    </div>
  )
}
