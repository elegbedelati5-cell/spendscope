import { useEffect } from 'react'

export default function BudgetNudgeToast({ category, onClose, onLearnMore }) {
  useEffect(() => {
    const t = window.setTimeout(() => onClose(), 12000)
    return () => window.clearTimeout(t)
  }, [onClose])

  if (!category) return null

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[90] w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg ring-1 ring-slate-900/5"
      role="status"
    >
      <p className="text-sm font-medium text-slate-900">Great!</p>
      <p className="mt-1 text-sm text-slate-600">
        Want to track <span className="font-semibold text-slate-800">{category}</span> with a budget?
      </p>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          Maybe later
        </button>
        <button
          type="button"
          onClick={onLearnMore}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          Learn more
        </button>
      </div>
    </div>
  )
}
