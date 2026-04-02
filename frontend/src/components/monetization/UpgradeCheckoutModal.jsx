import { useState } from 'react'
import { PDF_REPORTS_ADDON_NAIRA, PREMIUM_MONTHLY_NAIRA } from '../../constants/monetization'
import { clearPendingSoftOffer, setPendingSoftOffer, setPremiumDemo } from '../../utils/premiumStorage'

function formatNaira(n) {
  return `₦${Math.round(n).toLocaleString('en-NG')}`
}

export default function UpgradeCheckoutModal({ open, onClose, onDeferred, onSubscribed }) {
  const [pdfAddOn, setPdfAddOn] = useState(true)

  if (!open) return null

  const total = PREMIUM_MONTHLY_NAIRA + (pdfAddOn ? PDF_REPORTS_ADDON_NAIRA : 0)

  function handleMaybeLater() {
    setPendingSoftOffer()
    onDeferred?.()
    onClose()
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) {
      setPendingSoftOffer()
      onDeferred?.()
      onClose()
    }
  }

  function handleConfirm() {
    setPremiumDemo()
    clearPendingSoftOffer()
    onSubscribed?.({ pdfAddOn, total })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-title"
      onMouseDown={handleBackdrop}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="upgrade-title" className="text-lg font-bold text-slate-900">
          Upgrade to Premium
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Unlimited insights, budgets per category, and priority support.
        </p>

        <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/80 p-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-medium text-slate-800">Premium — monthly</span>
            <span className="text-lg font-bold text-indigo-700">{formatNaira(PREMIUM_MONTHLY_NAIRA)}</span>
          </div>
        </div>

        <div className="mt-4 rounded-xl border-2 border-amber-200 bg-amber-50/90 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={pdfAddOn}
              onChange={(e) => setPdfAddOn(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="flex-1 text-sm">
              <span className="font-semibold text-slate-900">Add Monthly PDF Reports</span>
              <span className="block text-slate-600">
                Auto-generated summary — only {formatNaira(PDF_REPORTS_ADDON_NAIRA)} extra
              </span>
            </span>
          </label>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-sm font-medium text-slate-600">Total due today</span>
          <span className="text-xl font-bold text-slate-900">{formatNaira(total)}</span>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Demo: no real charge. This simulates checkout for your product flow.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Confirm &amp; subscribe
          </button>
          <button
            type="button"
            onClick={handleMaybeLater}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
