import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

function IconPlus({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  )
}

export default function FloatingActionButton({ to, hidden, label = 'Add expense' }) {
  if (hidden) return null

  return (
    <motion.div
      className="fixed bottom-6 right-5 z-[60] sm:right-6 lg:bottom-8 lg:right-8"
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 24, delay: 0.12 }}
    >
      <Link to={to} aria-label={label} title={label}>
        <motion.span
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 text-white shadow-2xl shadow-indigo-600/35 ring-2 ring-white/30 dark:ring-slate-800/80"
          whileHover={{ scale: 1.06, boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.45)' }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 450, damping: 22 }}
        >
          <IconPlus className="h-7 w-7" />
        </motion.span>
      </Link>
    </motion.div>
  )
}
