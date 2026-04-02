import { PREMIUM_MONTHLY_NAIRA } from '../../constants/monetization'

function formatNaira(n) {
  return `₦${Math.round(n).toLocaleString('en-NG')}`
}

export default function SoftUpgradeTeaser({ onUpgrade, onDismiss }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-sm text-slate-700">
        <span className="font-medium text-slate-900">Still curious?</span> Premium starts at{' '}
        {formatNaira(PREMIUM_MONTHLY_NAIRA)}/mo — no pressure. You can try it whenever you are ready.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onUpgrade}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
        >
          View plans
        </button>
        <button type="button" onClick={onDismiss} className="text-xs font-medium text-slate-500 hover:text-slate-800">
          Dismiss
        </button>
      </div>
    </div>
  )
}
