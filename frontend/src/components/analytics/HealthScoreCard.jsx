import { motion } from 'framer-motion'
import { useId, useMemo } from 'react'
import { GlassCard } from '../ui/GlassCard'
import { CountUpInteger } from '../ui/CountUp'
import { formatNaira } from '../../utils/format'

const R = 36
const CIRC = 2 * Math.PI * R

function scoreBand(score) {
  if (score < 40)
    return {
      label: 'Needs attention',
      text: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-500/15 dark:bg-red-500/20',
    }
  if (score < 70)
    return {
      label: 'Fair',
      text: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-500/15 dark:bg-amber-500/20',
    }
  return {
    label: 'Strong',
    text: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-500/15 dark:bg-emerald-500/20',
  }
}

export default function HealthScoreCard({ data, loadError }) {
  const gradId = useId().replace(/:/g, '')
  const score = Number(data?.score) || 0
  const offset = useMemo(() => CIRC - (score / 100) * CIRC, [score])
  const shellClass = 'p-6 shadow-sm dark:border-white/10'

  if (loadError) {
    return (
      <GlassCard className={shellClass}>
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Financial health score</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">This month — essential vs discretionary</p>
        <p
          className="mt-5 rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          {loadError}. Try refreshing the page.
        </p>
      </GlassCard>
    )
  }

  if (!data) return null

  const band = scoreBand(score)

  return (
    <GlassCard className={shellClass}>
      <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Financial health score</h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">This month — essential vs discretionary</p>

      <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-8">
        <div className="relative h-28 w-28 shrink-0">
          <svg className="-rotate-90 transform" width="112" height="112" viewBox="0 0 100 100" aria-hidden>
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="45%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r={R} fill="none" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="10" />
            <motion.circle
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              initial={{ strokeDashoffset: CIRC }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.25, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <CountUpInteger value={score} className={`text-2xl font-bold tabular-nums ${band.text}`} />
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              / 100
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-2 text-sm">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${band.bg} ${band.text}`}
          >
            {band.label}
          </span>
          <p className="text-slate-600 dark:text-slate-300">
            Essential <span className="font-medium text-slate-800 dark:text-slate-100">{data.essentialPercent}%</span>
            {' · '}
            Discretionary{' '}
            <span className="font-medium text-slate-800 dark:text-slate-100">{data.discretionaryPercent}%</span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total tracked: {formatNaira(data.totalSpending)} · Essential categories include housing, food, transport,
            utilities, and similar needs.
          </p>
        </div>
      </div>
    </GlassCard>
  )
}
