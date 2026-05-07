import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { BudgetData } from '../types'

const COLORS = ['#C49A49', '#E8C878', '#F5F0E4', '#c45070', '#8040b4']
const ICONS: Record<string, string> = {
  Flights: '✈️', Hotels: '🏨', Food: '🍜', Activities: '🎭', Transport: '🚕',
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const duration = 800
    const start = performance.now()
    const raf = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(eased * value))
      if (t < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [value])
  return <span>₹{display.toLocaleString()}</span>
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
  if (!active || !payload?.length) return null
  return (
    <div
      className="lux-card"
      style={{ padding: '10px 14px', fontSize: '0.82rem' }}
    >
      <p style={{ color: 'rgb(var(--text-secondary))', fontWeight: 600 }}>
        {ICONS[payload[0].name] ?? '◈'} {payload[0].name}
      </p>
      <p className="text-gold-gradient" style={{ fontWeight: 800, fontSize: '1rem' }}>
        ₹{payload[0].value.toLocaleString()}
      </p>
    </div>
  )
}

export default function BudgetChart({
  budget,
  noOfMembers,
}: {
  budget: BudgetData | null
  noOfMembers: number
}) {
  if (!budget) {
    return (
      <div className="lux-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'rgb(var(--text-muted))' }}>Budget data not available.</p>
      </div>
    )
  }

  const total = Object.values(budget).reduce((a, b) => a + b, 0)
  const data = Object.entries(budget).map(([name, value]) => ({ name, value }))

  const metricColors = ['#C49A49', '#E8C878', '#c45070', '#f97316', '#8040b4']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3" style={{ gap: '10px' }}>
        {[
          { icon: '◆', label: 'Total Budget', value: total },
          { icon: '✈️', label: 'Flights', value: budget.Flights ?? 0 },
          { icon: '🏨', label: 'Hotels', value: budget.Hotels ?? 0 },
          { icon: '🍜', label: 'Food & Dining', value: budget.Food ?? 0 },
          { icon: '🎭', label: 'Activities', value: budget.Activities ?? 0 },
          { icon: '🚕', label: 'Transport', value: budget.Transport ?? 0 },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ scale: 1.03, y: -2 }}
            className="lux-card"
            style={{ padding: '1rem 1.1rem' }}
          >
            <p style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'rgb(var(--text-muted))',
              marginBottom: '6px',
            }}>
              {m.icon} {m.label}
            </p>
            <p style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '1.4rem',
              fontWeight: 900,
              color: metricColors[i % metricColors.length],
              lineHeight: 1,
            }}>
              <AnimatedNumber value={m.value} />
            </p>
          </motion.div>
        ))}
      </div>

      {/* Donut chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="lux-card"
        style={{ padding: '1.5rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
          <div style={{ height: '1px', width: '24px', background: 'rgb(var(--gold))', opacity: 0.6 }} />
          <span style={{
            fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase',
            color: 'rgb(var(--gold))', fontWeight: 600,
          }}>
            ◈ Budget Breakdown
          </span>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={75}
              outerRadius={115}
              paddingAngle={3}
              dataKey="value"
              animationBegin={0}
              animationDuration={900}
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={COLORS[i % COLORS.length]}
                  stroke="rgba(196,154,73,0.1)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => (
                <span style={{ color: 'rgb(var(--text-muted))', fontSize: '0.8rem' }}>
                  {ICONS[value] ?? '◈'} {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>

        <div style={{ textAlign: 'center', marginTop: '-8px' }}>
          <p className="text-gold-gradient" style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '2rem',
            fontWeight: 900,
            lineHeight: 1,
          }}>
            ₹{total.toLocaleString()}
          </p>
          <p style={{
            fontSize: '0.62rem',
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            color: 'rgb(var(--text-muted))',
            marginTop: '6px',
          }}>
            Total estimated cost
          </p>
        </div>
      </motion.div>

      {/* Per person */}
      {noOfMembers > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lux-card"
          style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <span style={{ fontSize: '1.3rem' }}>◎</span>
          <p style={{ fontSize: '0.86rem', color: 'rgb(var(--text-muted))', lineHeight: 1.5 }}>
            Per person cost:{' '}
            <strong className="text-gold-gradient" style={{ fontSize: '1.05rem' }}>
              ₹{Math.round(total / noOfMembers).toLocaleString()}
            </strong>
            {' '}across {noOfMembers} travellers
          </p>
        </motion.div>
      )}
    </div>
  )
}
