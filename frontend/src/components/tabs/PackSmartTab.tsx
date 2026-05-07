import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Package, ChevronDown, ChevronUp, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchPackingList } from '../../lib/api'
import { useAppStore } from '../../store/useAppStore'
import { VIBE_MAP, PACK_EMOJIS } from '../../types'

const PACKING_TIPS = [
  'Roll clothes instead of folding — saves 30% space',
  'Pack half the clothes, twice the money',
  'Use packing cubes to stay organised',
  'Wear your heaviest shoes on the plane',
  'One universal power adapter beats 3 specific ones',
  'Carry meds in original packaging at border crossings',
]

function PackingCategory({
  category,
  items,
  emoji,
  checked,
  onToggle,
}: {
  category: string
  items: string[]
  emoji: string
  checked: Record<string, boolean>
  onToggle: (key: string) => void
}) {
  const [open, setOpen] = useState(true)
  const doneCount = items.filter((i) => checked[`${category}_${i}`]).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="lux-card"
      style={{ overflow: 'hidden' }}
    >
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          textAlign: 'left',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          borderBottom: open ? '1px solid rgba(196,154,73,0.12)' : 'none',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.1rem' }}>{emoji}</span>
          <span style={{
            fontWeight: 700,
            fontSize: '0.85rem',
            color: 'rgb(var(--text-primary))',
            fontFamily: 'DM Sans, sans-serif',
            letterSpacing: '0.04em',
          }}>
            {category}
          </span>
          <span style={{
            padding: '2px 9px',
            borderRadius: '100px',
            fontSize: '0.68rem',
            fontWeight: 700,
            background: doneCount === items.length
              ? 'rgba(196,154,73,0.2)'
              : 'rgba(196,154,73,0.08)',
            border: '1px solid rgba(196,154,73,0.25)',
            color: 'rgb(var(--gold))',
          }}>
            {doneCount}/{items.length}
          </span>
        </div>
        {open
          ? <ChevronUp size={15} style={{ color: 'rgb(var(--text-muted))' }} />
          : <ChevronDown size={15} style={{ color: 'rgb(var(--text-muted))' }} />
        }
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.map((item) => {
                const key = `${category}_${item}`
                return (
                  <motion.label
                    key={item}
                    whileHover={{ x: 3 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                  >
                    <input
                      type="checkbox"
                      className="lux-checkbox"
                      checked={!!checked[key]}
                      onChange={() => onToggle(key)}
                    />
                    <span style={{
                      fontSize: '0.83rem',
                      transition: 'all 0.2s',
                      color: checked[key] ? 'rgb(var(--text-muted))' : 'rgb(var(--text-primary))',
                      textDecoration: checked[key] ? 'line-through' : 'none',
                      opacity: checked[key] ? 0.55 : 1,
                    }}>
                      {item}
                    </span>
                  </motion.label>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function PackSmartTab() {
  const { packChecked, togglePackItem, resetPackChecked } = useAppStore()

  const [destination, setDestination] = useState('')
  const [noDays, setNoDays] = useState(7)
  const [vibe, setVibe] = useState(Object.keys(VIBE_MAP)[0])
  const [interests, setInterests] = useState(VIBE_MAP[Object.keys(VIBE_MAP)[0]])
  const [packList, setPackList] = useState<Record<string, string[]> | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const totalItems = packList ? Object.values(packList).reduce((a, b) => a + b.length, 0) : 0
  const checkedCount = packList
    ? Object.values(packList).reduce(
        (acc, items, catIndex) => {
          const cat = Object.keys(packList)[catIndex]
          return acc + items.filter((i) => packChecked[`${cat}_${i}`]).length
        },
        0
      )
    : 0

  const handleGenerate = async () => {
    if (!destination.trim()) {
      toast.error('Please enter a destination.')
      return
    }
    setIsLoading(true)
    resetPackChecked()
    setPackList(null)
    try {
      const result = await fetchPackingList({
        destination,
        no_of_days: noDays,
        trip_vibe: vibe,
        interests,
      })
      setPackList(result)
      toast.success('Packing list ready!')
    } catch {
      toast.error('Could not generate packing list — is the backend running?')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (!packList) return
    const lines = [`◇ Wandrly Packing List — ${destination} (${noDays} days)\n`]
    for (const [cat, items] of Object.entries(packList)) {
      lines.push(`\n${PACK_EMOJIS[cat] ?? '◈'} ${cat}`)
      lines.push('─'.repeat(30))
      for (const item of items) {
        const key = `${cat}_${item}`
        lines.push(`  ${packChecked[key] ? '✓' : '○'} ${item}`)
      }
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Wandrly_Pack_${destination.replace(/\s+/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded!')
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
            ◇ AI Packing Assistant
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
          Pack Smart, Travel Light
        </h2>
        <p style={{ color: 'rgb(var(--text-muted))', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Tell our AI where you're going and it'll build a custom packing list. Never over-pack again.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-[1fr,300px]" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lux-card"
          style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          <div>
            <label className="lux-label">✦ Destination</label>
            <input
              className="lux-input"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Bali, Indonesia"
            />
          </div>
          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div>
              <label className="lux-label">◈ Number of days</label>
              <input
                type="number"
                className="lux-input"
                min={1}
                max={60}
                value={noDays}
                onChange={(e) => setNoDays(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <label className="lux-label">◎ Trip vibe</label>
              <select
                className="lux-select"
                value={vibe}
                onChange={(e) => {
                  setVibe(e.target.value)
                  setInterests(VIBE_MAP[e.target.value])
                }}
              >
                {Object.keys(VIBE_MAP).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="lux-label">◇ Activities planned</label>
            <input
              className="lux-input"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="e.g. beach, hiking, fine dining..."
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleGenerate}
            disabled={isLoading}
            className="btn-luxury"
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '12px',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '9px',
              cursor: isLoading ? 'wait' : 'pointer',
              fontFamily: 'Cormorant Garamond, serif',
              fontWeight: 700,
              letterSpacing: '0.06em',
            }}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Package size={18} />}
            {isLoading ? `Building list for ${destination}…` : 'Generate Packing List'}
          </motion.button>
        </motion.div>

        {/* Packing wisdom */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lux-card"
          style={{ padding: '1.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
            <div style={{ height: '1px', width: '20px', background: 'rgb(var(--gold))', opacity: 0.6 }} />
            <span style={{
              fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase',
              color: 'rgb(var(--gold))', fontWeight: 600,
            }}>
              ✦ Packing Wisdom
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {PACKING_TIPS.map((tip, i) => (
              <motion.div
                key={tip}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}
              >
                <span style={{ color: 'rgb(var(--gold))', fontSize: '0.65rem', marginTop: '3px', flexShrink: 0 }}>◆</span>
                <p style={{ fontSize: '0.82rem', lineHeight: 1.6, color: 'rgb(var(--text-muted))' }}>{tip}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Packing list results */}
      <AnimatePresence>
        {packList && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Stats row */}
            <div className="grid grid-cols-3" style={{ gap: '12px', marginBottom: '1.25rem' }}>
              {[
                { label: 'Total Items', value: totalItems, icon: '◈' },
                { label: 'Packed', value: checkedCount, icon: '✦' },
                { label: 'Remaining', value: totalItems - checkedCount, icon: '◇' },
              ].map((m) => (
                <motion.div
                  key={m.label}
                  whileHover={{ scale: 1.03, y: -2 }}
                  className="lux-card"
                  style={{ padding: '1.1rem', textAlign: 'center' }}
                >
                  <p style={{ color: 'rgb(var(--gold))', fontSize: '1.1rem', marginBottom: '4px' }}>{m.icon}</p>
                  <p className="text-gold-gradient" style={{
                    fontFamily: 'Playfair Display, serif',
                    fontWeight: 900,
                    fontSize: '1.6rem',
                    lineHeight: 1,
                  }}>
                    {m.value}
                  </p>
                  <p style={{
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: 'rgb(var(--text-muted))',
                    marginTop: '4px',
                  }}>
                    {m.label}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Progress bar */}
            {totalItems > 0 && (
              <div
                className="lux-card"
                style={{ padding: '12px 16px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <div style={{
                  flex: 1, height: '6px', borderRadius: '100px', overflow: 'hidden',
                  background: 'rgba(196,154,73,0.1)',
                }}>
                  <motion.div
                    className="lux-progress-fill"
                    style={{ height: '100%', borderRadius: '100px' }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${(checkedCount / totalItems) * 100}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <span className="text-gold-gradient" style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '36px' }}>
                  {Math.round((checkedCount / totalItems) * 100)}%
                </span>
              </div>
            )}

            {/* Categories grid */}
            <div className="grid sm:grid-cols-2" style={{ gap: '1rem', marginBottom: '1.25rem' }}>
              {Object.entries(packList).map(([cat, items]) => (
                <PackingCategory
                  key={cat}
                  category={cat}
                  items={items}
                  emoji={PACK_EMOJIS[cat] ?? '◈'}
                  checked={packChecked}
                  onToggle={togglePackItem}
                />
              ))}
            </div>

            {/* Download */}
            <motion.button
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownload}
              className="btn-ghost-gold"
              style={{
                width: '100%',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '9px',
                fontSize: '0.88rem',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 600,
                letterSpacing: '0.06em',
              }}
            >
              <Download size={15} />
              Download Packing List
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
