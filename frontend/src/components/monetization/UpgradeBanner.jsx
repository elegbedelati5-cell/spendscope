import { PREMIUM_EXPENSE_THRESHOLD } from '../../constants/monetization'

export default function UpgradeBanner({ expenseCount, onUpgrade, onDismiss }) {
  if (expenseCount < PREMIUM_EXPENSE_THRESHOLD) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-linear-to-r from-indigo-50 to-violet-50 px-4 py-3 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-indigo-900">Upgrade to Premium</p>
        <p className="mt-0.5 text-xs text-indigo-800/90">
          You have logged {expenseCount}+ expenses. Unlock budgets, exports, and more.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onUpgrade}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          Upgrade
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-xl px-3 py-2 text-xs font-medium text-indigo-800 hover:bg-indigo-100/80"
        >
          Not now
        </button>
      </div>
    </div>
  )
}
