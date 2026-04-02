import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../api/client'
import BudgetNudgeToast from '../components/monetization/BudgetNudgeToast'
import { EXPENSE_CATEGORY_OPTIONS, EXPENSE_CATEGORIES } from '../constants/categories'
import { formatNaira } from '../utils/format'

const QUICK_AMOUNTS = [1000, 5000, 10000, 20000, 50000, 100000]

function todayInputValue() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function validateFields({ amount, date }) {
  const errors = {}
  const raw = String(amount).trim()
  if (!raw) {
    errors.amount = 'Enter an amount.'
  } else {
    const n = Number(raw)
    if (!Number.isFinite(n) || n <= 0) {
      errors.amount = 'Use a valid amount greater than zero.'
    }
  }
  if (!date) {
    errors.date = 'Pick the date of this expense.'
  }
  return errors
}

const inputBase =
  'mt-1.5 w-full min-h-11 rounded-xl border bg-white px-3.5 py-2.5 text-base text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 sm:text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500'
const inputNormal = `${inputBase} border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/25 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/25`
const inputError = `${inputBase} border-red-300 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500/60 dark:focus:ring-red-500/30`

export default function AddExpense() {
  const navigate = useNavigate()
  const location = useLocation()
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(EXPENSE_CATEGORY_OPTIONS[0].value)
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayInputValue)
  const [fieldErrors, setFieldErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [addAnother, setAddAnother] = useState(false)
  const [savedBanner, setSavedBanner] = useState(false)
  const [budgetNudgeCategory, setBudgetNudgeCategory] = useState(null)

  useEffect(() => {
    if (!savedBanner) return undefined
    const t = window.setTimeout(() => setSavedBanner(false), 5000)
    return () => window.clearTimeout(t)
  }, [savedBanner])

  useEffect(() => {
    const preset = location.state?.presetCategory
    if (preset && EXPENSE_CATEGORIES.includes(preset)) {
      setCategory(preset)
    }
  }, [location.state])

  function resetForm() {
    setAmount('')
    setDescription('')
    setDate(todayInputValue())
    setCategory(EXPENSE_CATEGORY_OPTIONS[0].value)
    setFieldErrors({})
    setServerError('')
  }

  function applyQuickAmount(value) {
    setAmount(String(value))
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next.amount
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')
    const errors = validateFields({ amount, date })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      return
    }

    setLoading(true)
    try {
      await api.post('/expenses', {
        amount: Number(amount),
        category,
        description: description.trim(),
        date,
      })
      if (addAnother) {
        resetForm()
        setSavedBanner(true)
        setBudgetNudgeCategory(category)
      } else {
        navigate('/dashboard', {
          replace: true,
          state: {
            flash: 'Expense saved successfully.',
            budgetNudgeCategory: category,
          },
        })
      }
    } catch (err) {
      setServerError(err.response?.data?.error || 'Could not save expense. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-0 sm:px-1">
      {budgetNudgeCategory ? (
        <BudgetNudgeToast
          category={budgetNudgeCategory}
          onClose={() => setBudgetNudgeCategory(null)}
          onLearnMore={() => {
            setBudgetNudgeCategory(null)
            navigate('/dashboard', { state: { openUpgrade: true } })
          }}
        />
      ) : null}

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Add expense</h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">
          Log a purchase or bill so your dashboard and insights stay up to date.
        </p>
      </div>

      {savedBanner ? (
        <div
          className="mb-6 flex items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-950/50 dark:text-emerald-100"
          role="status"
        >
          <p className="font-medium">Saved. You can add another expense below.</p>
          <button
            type="button"
            onClick={() => setSavedBanner(false)}
            className="shrink-0 rounded-lg px-2 py-1 text-emerald-800 hover:bg-emerald-100 dark:text-emerald-200 dark:hover:bg-emerald-900/60"
            aria-label="Dismiss"
          >
            OK
          </button>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="space-y-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-md ring-1 ring-slate-100 dark:border-slate-700 dark:bg-slate-900/90 dark:ring-slate-800 sm:p-8"
        noValidate
      >
        {serverError ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-100 dark:bg-red-950/50 dark:text-red-200 dark:ring-red-900/50">
            {serverError}
          </p>
        ) : null}

        <section className="space-y-3">
          <div>
            <label htmlFor="amount" className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Amount
            </label>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Enter the total in Nigerian naira (NGN).</p>
          </div>
          <input
            id="amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            autoComplete="off"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              if (fieldErrors.amount) {
                setFieldErrors((prev) => {
                  const next = { ...prev }
                  delete next.amount
                  return next
                })
              }
            }}
            className={fieldErrors.amount ? inputError : inputNormal}
            placeholder="e.g. 3500"
            aria-invalid={Boolean(fieldErrors.amount)}
            aria-describedby={fieldErrors.amount ? 'amount-error' : 'amount-hint'}
          />
          <p id="amount-hint" className="sr-only">
            Whole number or decimal amount in naira
          </p>
          {fieldErrors.amount ? (
            <p id="amount-error" className="text-sm font-medium text-red-600">
              {fieldErrors.amount}
            </p>
          ) : null}

          <div className="pt-1">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Quick amounts
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => applyQuickAmount(v)}
                  className="min-h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-800 active:scale-[0.98] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-200 sm:text-sm"
                >
                  {formatNaira(v)}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-slate-100 pt-8 dark:border-slate-800">
          <div className="mb-3">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Category</span>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">What kind of spending was this?</p>
          </div>
          <div
            className="grid grid-cols-2 gap-2 sm:grid-cols-3"
            role="group"
            aria-label="Expense category"
          >
            {EXPENSE_CATEGORY_OPTIONS.map((opt) => {
              const selected = category === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCategory(opt.value)}
                  aria-pressed={selected}
                  className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-2.5 text-center text-xs font-medium transition-all sm:text-sm ${
                    selected
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm ring-2 ring-indigo-500/20 dark:border-indigo-400 dark:bg-indigo-950/60 dark:text-indigo-100 dark:ring-indigo-400/30'
                      : 'border-slate-200 bg-slate-50/80 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-lg leading-none" aria-hidden>
                    {opt.icon}
                  </span>
                  <span className="line-clamp-2 leading-tight">{opt.label}</span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="space-y-3 border-t border-slate-100 pt-8 dark:border-slate-800">
          <div>
            <label htmlFor="description" className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Description{' '}
              <span className="font-normal text-slate-500 dark:text-slate-400">(optional)</span>
            </label>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Short note so you remember later (store, item, etc.).</p>
          </div>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputNormal}
            placeholder="e.g. Pizza with team"
            maxLength={200}
          />
        </section>

        <section className="space-y-3 border-t border-slate-100 pt-8 dark:border-slate-800">
          <div>
            <label htmlFor="date" className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Date
            </label>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Defaults to today. Change it if the expense happened on another day.
            </p>
          </div>
          <input
            id="date"
            type="date"
            required
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              if (fieldErrors.date) {
                setFieldErrors((prev) => {
                  const next = { ...prev }
                  delete next.date
                  return next
                })
              }
            }}
            className={fieldErrors.date ? inputError : inputNormal}
            aria-invalid={Boolean(fieldErrors.date)}
            aria-describedby={fieldErrors.date ? 'date-error' : undefined}
          />
          {fieldErrors.date ? (
            <p id="date-error" className="text-sm font-medium text-red-600">
              {fieldErrors.date}
            </p>
          ) : null}
        </section>

        <div className="border-t border-slate-100 pt-6 dark:border-slate-800">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
            <input
              type="checkbox"
              checked={addAnother}
              onChange={(e) => setAddAnother(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-500 dark:bg-slate-900 dark:text-indigo-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              <span className="font-medium text-slate-900 dark:text-slate-50">Add another expense after saving</span>
              <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                Stay on this page with a fresh form instead of returning to the dashboard.
              </span>
            </span>
          </label>
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row-reverse sm:justify-start">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-linear-to-b from-indigo-600 to-indigo-700 px-5 text-sm font-semibold text-white shadow-md shadow-indigo-900/15 transition hover:from-indigo-500 hover:to-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-44"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-hidden
                />
                Saving...
              </span>
            ) : (
              'Save expense'
            )}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => navigate(-1)}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
