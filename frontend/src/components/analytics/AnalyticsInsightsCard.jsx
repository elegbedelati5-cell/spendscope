import { GlassCard } from '../ui/GlassCard'

export default function AnalyticsInsightsCard({ data, fallbackLines = [], loadError }) {
  const messages = data?.messages?.length ? data.messages : !loadError ? fallbackLines : []
  const showFallbackOnly = Boolean(loadError && fallbackLines.length)

  return (
    <GlassCard className="p-6 shadow-sm sm:p-8 dark:border-white/10">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sm font-bold text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
          30d
        </span>
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Spending analysis</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {loadError
              ? '30-day analysis unavailable — see below if we have this month’s tips'
              : data
                ? 'Last 30 days vs previous 30 days'
                : 'This month (add data for rolling analysis)'}
          </p>
        </div>
      </div>

      {loadError ? (
        <p
          className="mt-4 rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          {loadError}. Try refreshing the page.
        </p>
      ) : null}

      {showFallbackOnly ? (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">This month</p>
          <ul className="mt-3 space-y-3">
            {fallbackLines.map((line, i) => (
              <li key={`${i}-${line.slice(0, 48)}`} className="flex gap-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!loadError && data?.highestCategory ? (
        <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800/50">
          <p className="font-medium text-slate-800 dark:text-slate-100">Top category</p>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-slate-50">{data.highestCategory.name}</span>
            {' — '}
            {data.highestCategory.percentOfTotal}% of last 30 days
          </p>
        </div>
      ) : null}

      {!loadError && data?.spendingChangePercent != null ? (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          <span className="font-medium text-slate-800 dark:text-slate-100">Rolling 30-day total</span> vs prior 30 days:{' '}
          <span
            className={
              data.spendingChangePercent > 0 ? 'font-semibold text-amber-700' : 'font-semibold text-emerald-700'
            }
          >
            {data.spendingChangePercent > 0 ? '+' : ''}
            {data.spendingChangePercent}%
          </span>
        </p>
      ) : null}

      {!showFallbackOnly && messages?.length ? (
        <ul className="mt-6 space-y-3">
          {messages.map((line, i) => (
            <li key={`${i}-${line.slice(0, 48)}`} className="flex gap-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {!loadError && !showFallbackOnly && !messages?.length ? (
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">Add expenses to see 30-day analysis.</p>
      ) : null}

      {!loadError && data?.categoryConcentrationWarnings?.length ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-950/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200">Concentration</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-900 dark:text-amber-100">
            {data.categoryConcentrationWarnings.map((w) => (
              <li key={w.category}>
                {w.category} is {w.percent}% of spending (above 40%).
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </GlassCard>
  )
}
