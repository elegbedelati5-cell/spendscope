import { motion } from 'framer-motion'

export function GlassCard({ children, className = '', ...rest }) {
  return (
    <motion.div
      className={`rounded-2xl border border-white/40 bg-white/50 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/50 ${className}`}
      whileHover={{
        y: -3,
        transition: { type: 'spring', stiffness: 420, damping: 28 },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
