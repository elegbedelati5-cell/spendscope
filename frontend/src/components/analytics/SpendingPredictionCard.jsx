import { GlassCard } from '../ui/GlassCard'
import { AnimatedProgressBar } from '../ui/AnimatedProgressBar'
import { CountUpNaira } from '../ui/CountUp'
import { formatNaira } from '../../utils/format'

export default function SpendingPredictionCard({ data, loadError }) {
  const shellClass = 'p-6 shadow-sm dark:border-white/10'

  if (loadError) {
    return (
      <GlassCard className={shellClass}>
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Month-end forecast</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Projected total based on your daily average</p>
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

  const diff = data.difference_from_budget
  const hasBudget = data.monthly_budget != null && Number.isFinite(diff)

  return (
    <GlassCard className={shellClass}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Month-end forecast</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Day {data.days_elapsed} of {data.days_in_month} · pace-based projection
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <span>Month progress</span>
          <span>
            {data.days_elapsed}/{data.days_in_month} days
          </span>
        </div>
        <AnimatedProgressBar value={data.days_elapsed} max={data.days_in_month} />
      </div>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-600 dark:text-slate-400">Spent this month</dt>
          <dd className="font-semibold text-slate-900 dark:text-slate-50">
            <CountUpNaira value={data.current_spending} />
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-600 dark:text-slate-400">Daily average</dt>
          <dd className="font-medium text-slate-800 dark:text-slate-200">
            <CountUpNaira value={data.daily_average} />
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-slate-200/80 pt-3 dark:border-slate-700/80">
          <dt className="text-slate-600 dark:text-slate-400">Projected month total</dt>
          <dd className="font-semibold text-indigo-600 dark:text-indigo-400">
            <CountUpNaira value={data.predicted_spending} />
          </dd>
        </div>
      </dl>

      {hasBudget ? (
        <div
          className={`mt-4 rounded-xl px-4 py-3 text-sm ${
            diff >= 0
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/50 dark:text-emerald-100'
              : 'border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/50 dark:text-amber-100'
          }`}
        >
          <p className="font-medium">vs monthly budget {formatNaira(data.monthly_budget)}</p>
          <p className="mt-1">
            {diff >= 0 ? (
              <>
                Under budget by about <CountUpNaira value={diff} /> at current pace.
              </>
            ) : (
              <>
                Over projected budget by about <CountUpNaira value={Math.abs(diff)} /> at current pace.
              </>
            )}
          </p>
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-slate-200/90 bg-slate-50/80 px-4 py-3 text-xs text-slate-600 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
          Set <code className="rounded bg-white px-1 dark:bg-slate-900">localStorage.spendscope_monthly_budget</code>{' '}
          (naira) to compare against a monthly budget.
        </p>
      )}
    </GlassCard>
  )
}
