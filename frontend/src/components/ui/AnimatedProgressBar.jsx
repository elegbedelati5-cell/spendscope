import { motion } from 'framer-motion'

export function AnimatedProgressBar({ value, max = 100, className = '' }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (Number(value) / Number(max)) * 100)) : 0

  return (
    <div
      className={`h-2.5 w-full overflow-hidden rounded-full bg-slate-200/90 dark:bg-slate-700/80 ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  )
}
