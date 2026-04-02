import { useCallback, useEffect, useState } from 'react'
import api from '../api/client'
import { EXPENSE_CATEGORIES } from '../constants/categories'
import { formatDate, formatNaira } from '../utils/format'
import { getApiErrorMessage } from '../utils/apiErrorMessage'

const PAGE_SIZE = 15
const EXPORT_CAP = 2000

function toInputDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

const PERIOD = {
  ALL: 'all',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  CUSTOM: 'custom',
}

function TrashIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  )
}

function DeleteExpenseButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200/90 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 shadow-sm transition-all duration-200 ease-out hover:border-red-300 hover:bg-red-50 hover:text-red-800 hover:shadow-md active:scale-[0.96] motion-safe:hover:-translate-y-px dark:border-red-800/80 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/50"
    >
      <TrashIcon className="h-3.5 w-3.5 shrink-0 opacity-80" />
      <span>Delete</span>
    </button>
  )
}

export default function Transactions() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalAmount, setTotalAmount] = useState(0)
  const [page, setPage] = useState(1)

  const [from, setFrom] = useState('')
  const [toQ, setToQ] = useState('')
  const [period, setPeriod] = useState(PERIOD.ALL)
  const [category, setCategory] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchList = useCallback(
    async (forPage) => {
      const p = forPage ?? page
      setError('')
      setLoading(true)
      try {
        const params = { page: p, pageSize: PAGE_SIZE }
        if (from) params.from = from
        if (toQ) params.to = toQ
        if (category) params.category = category
        if (searchQuery) params.search = searchQuery
        const { data } = await api.get('/expenses', { params })
        setItems(data.items || [])
        setTotal(data.total ?? 0)
        setTotalPages(data.totalPages ?? 1)
        setTotalAmount(Number(data.totalAmount ?? 0))
        setPage(data.page ?? p)
      } catch (e) {
        setError(getApiErrorMessage(e, 'Could not load transactions'))
        setItems([])
      } finally {
        setLoading(false)
      }
    },
    [page, from, toQ, category, searchQuery],
  )

  useEffect(() => {
    fetchList(page)
  }, [fetchList, page])

  useEffect(() => {
    const t = window.setTimeout(() => setSearchQuery(searchDraft.trim()), 400)
    return () => window.clearTimeout(t)
  }, [searchDraft])

  useEffect(() => {
    setPage(1)
  }, [searchQuery])

  function setPeriodAll() {
    setPeriod(PERIOD.ALL)
    setFrom('')
    setToQ('')
    setPage(1)
  }

  function setPeriodThisMonth() {
    const now = new Date()
    setPeriod(PERIOD.THIS_MONTH)
    setFrom(toInputDate(startOfMonth(now)))
    setToQ(toInputDate(endOfMonth(now)))
    setPage(1)
  }

  function setPeriodLastMonth() {
    const now = new Date()
    const ref = new Date(now.getFullYear(), now.getMonth() - 1, 15)
    setPeriod(PERIOD.LAST_MONTH)
    setFrom(toInputDate(startOfMonth(ref)))
    setToQ(toInputDate(endOfMonth(ref)))
    setPage(1)
  }

  function handleCustomDateChange() {
    setPeriod(PERIOD.CUSTOM)
  }

  function applyCustomRange() {
    setPage(1)
    fetchList(1)
  }

  function handleCategoryChange(e) {
    setCategory(e.target.value)
    setPage(1)
  }

  async function handleExportCsv() {
    setExporting(true)
    setError('')
    try {
      const params = { page: 1, pageSize: EXPORT_CAP }
      if (from) params.from = from
      if (toQ) params.to = toQ
      if (category) params.category = category
      if (searchQuery) params.search = searchQuery
      const { data } = await api.get('/expenses', { params })
      const rows = data.items || []
      if (rows.length === 0) {
        setError('No transactions to export for the current filters.')
        return
      }
      const header = ['Date', 'Amount (NGN)', 'Category', 'Description']
      const lines = [header.join(',')]
      for (const tx of rows) {
        const desc = (tx.description || '').replace(/"/g, '""')
        lines.push(
          [
            String(tx.date).slice(0, 10),
            tx.amount,
            `"${(tx.category || '').replace(/"/g, '""')}"`,
            `"${desc}"`,
          ].join(','),
        )
      }
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `spendscope-transactions-${toInputDate(new Date())}.csv`
      a.click()
      URL.revokeObjectURL(url)
      if ((data.total || 0) > EXPORT_CAP) {
        setError(`Exported first ${EXPORT_CAP} rows. Narrow filters to export more in batches.`)
      }
    } catch (e) {
      setError(getApiErrorMessage(e, 'Export failed'))
    } finally {
      setExporting(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setError('')
    try {
      const onlyRow = items.length === 1
      const currentPage = page
      await api.delete(`/expenses/${deleteTarget.id}`)
      setDeleteTarget(null)
      if (onlyRow && currentPage > 1) {
        setPage(currentPage - 1)
      } else {
        await fetchList(currentPage)
      }
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not delete'))
    } finally {
      setDeleting(false)
    }
  }

  const periodBtn = (active) =>
    `rounded-xl px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
      active
        ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-500'
        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
    }`

  const inputClass =
    'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20'

  const noFiltersActive =
    period === PERIOD.ALL && !from && !toQ && !category && !searchQuery

  const filteredCardKey = [period, from, toQ, category, searchQuery].join('|')

  return (
    <div className="space-y-7 sm:space-y-8">
      <div className="tx-animate-fade-up flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
            Transactions
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Search, filter by period or category, and export your history. Amounts use your active
            filters.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={exporting || loading}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-800"
        >
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {(total > 0 || loading || from || toQ || category || searchQuery || period !== PERIOD.ALL) && (
        <div
          key={filteredCardKey}
          className="tx-filtered-card-frame relative rounded-2xl border border-indigo-100/80 bg-linear-to-br from-indigo-600 via-indigo-600 to-violet-700 p-1 shadow-lg shadow-indigo-500/25 sm:rounded-3xl"
        >
          <div className="relative overflow-hidden rounded-[0.875rem] bg-white dark:bg-slate-900 sm:rounded-[1.25rem]">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-1.5 rounded-l-[0.875rem] bg-linear-to-b from-indigo-500 to-violet-600 sm:rounded-l-[1.25rem]"
              aria-hidden
            />
            <div className="px-6 py-6 pl-5 sm:px-8 sm:py-7 sm:pl-6">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-indigo-600/90 dark:text-indigo-400/90">
                Filtered total
              </p>
              {loading ? (
                <div className="mt-3 space-y-3" aria-busy="true" aria-label="Loading totals">
                  <span className="tx-filtered-skeleton inline-block h-9 w-40 rounded-lg bg-slate-200/90 dark:bg-slate-700 sm:h-11 sm:w-48" />
                  <span className="tx-filtered-skeleton block h-4 w-56 rounded bg-slate-200/80 dark:bg-slate-700" />
                </div>
              ) : (
                <div
                  key={`${totalAmount}-${total}`}
                  className="tx-filtered-card-stats mt-3 space-y-3"
                >
                  <p className="text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">
                    <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-violet-600">
                      {formatNaira(totalAmount)}
                    </span>
                  </p>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    <span className="tabular-nums font-semibold text-slate-800 dark:text-slate-100">{total}</span>{' '}
                    transaction{total === 1 ? '' : 's'} in view
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="tx-animate-fade-up space-y-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/90 sm:rounded-3xl sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Period</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className={periodBtn(period === PERIOD.ALL)} onClick={setPeriodAll}>
              All time
            </button>
            <button
              type="button"
              className={periodBtn(period === PERIOD.THIS_MONTH)}
              onClick={setPeriodThisMonth}
            >
              This month
            </button>
            <button
              type="button"
              className={periodBtn(period === PERIOD.LAST_MONTH)}
              onClick={setPeriodLastMonth}
            >
              Last month
            </button>
            <button
              type="button"
              className={periodBtn(period === PERIOD.CUSTOM)}
              onClick={() => setPeriod(PERIOD.CUSTOM)}
            >
              Custom range
            </button>
          </div>
        </div>

        {(period === PERIOD.CUSTOM || period === PERIOD.ALL) && (
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-0 flex-1 sm:max-w-44">
              <label htmlFor="from" className="text-xs font-medium text-slate-600 dark:text-slate-300">
                From
              </label>
              <input
                id="from"
                type="date"
                value={from}
                onChange={(e) => {
                  handleCustomDateChange()
                  setFrom(e.target.value)
                }}
                className={inputClass}
              />
            </div>
            <div className="min-w-0 flex-1 sm:max-w-44">
              <label htmlFor="to" className="text-xs font-medium text-slate-600 dark:text-slate-300">
                To
              </label>
              <input
                id="to"
                type="date"
                value={toQ}
                onChange={(e) => {
                  handleCustomDateChange()
                  setToQ(e.target.value)
                }}
                className={inputClass}
              />
            </div>
            <button
              type="button"
              onClick={applyCustomRange}
              className="min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              Apply range
            </button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="search" className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Search
            </label>
            <p className="text-xs text-slate-400 dark:text-slate-500">Matches description or category</p>
            <input
              id="search"
              type="search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="e.g. Uber, Food, rent"
              className={inputClass}
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="cat" className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Category
            </label>
            <p className="text-xs text-slate-400 dark:text-slate-500">Leave as All for every category</p>
            <select id="cat" value={category} onChange={handleCategoryChange} className={inputClass}>
              <option value="">All categories</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <p className="tx-animate-fade-up rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm ring-1 ring-red-100/80 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900/30">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="tx-animate-fade-up flex items-center gap-4 rounded-2xl border border-slate-200/90 bg-white px-8 py-10 text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 sm:rounded-3xl">
          <span
            className="h-6 w-6 shrink-0 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"
            aria-hidden
          />
          <span className="text-sm font-medium">Loading transactions...</span>
        </div>
      ) : total === 0 ? (
        <div className="tx-animate-fade-up relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-200/90 bg-linear-to-b from-slate-50 to-white px-8 py-16 text-center shadow-inner dark:border-slate-600 dark:from-slate-900 dark:to-slate-950 sm:rounded-3xl sm:py-20">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-100/40 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-violet-100/35 blur-3xl"
            aria-hidden
          />
          <div className="tx-empty-icon relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-slate-200/80 dark:bg-slate-800 dark:ring-slate-600">
            <svg
              className="h-9 w-9 text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 13V7a2 2 0 00-2-2h-3V3H9v2H6a2 2 0 00-2 2v6m16 0v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4m16 0h-2M4 13h2m0 0V9a2 2 0 012-2h8a2 2 0 012 2v4M9 13h6"
              />
            </svg>
          </div>
          {noFiltersActive ? (
            <>
              <p className="relative mt-8 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Your ledger is empty
              </p>
              <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Start on the dashboard with <span className="font-semibold text-slate-800 dark:text-slate-100">Add expense</span>.
                Every purchase you log will show up here with filters, search, and exports.
              </p>
            </>
          ) : (
            <>
              <p className="relative mt-8 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                No matches for these filters
              </p>
              <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Try <span className="font-semibold text-slate-800 dark:text-slate-100">All time</span>, clear the search
                field, or pick another category. You can also widen the custom date range.
              </p>
            </>
          )}
        </div>
      ) : (
        <>
          <ul className="space-y-4 md:hidden">
            {items.map((tx, i) => (
              <li
                key={tx.id}
                style={{ '--tx-delay': `${Math.min(i, 12) * 45}ms` }}
                className="tx-row-enter rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-100/80 transition-all duration-200 ease-out hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-800 dark:hover:border-slate-600"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
                      {formatNaira(tx.amount)}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-indigo-900/80 dark:text-indigo-300">{tx.category}</p>
                    {tx.description ? (
                      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{tx.description}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-3">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{formatDate(tx.date)}</p>
                    <DeleteExpenseButton onClick={() => setDeleteTarget(tx)} />
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="tx-animate-fade-up hidden overflow-hidden rounded-2xl border-2 border-slate-200/90 bg-white shadow-md ring-1 ring-slate-100/50 dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-800 md:block sm:rounded-3xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-linear-to-b from-slate-100 to-slate-50/95 text-left text-[0.7rem] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900/95 dark:text-slate-400">
                    <th className="whitespace-nowrap border-r border-slate-200/80 px-5 py-4 first:pl-6">
                      Date
                    </th>
                    <th className="whitespace-nowrap border-r border-slate-200/80 px-5 py-4 text-right">
                      Amount
                    </th>
                    <th className="whitespace-nowrap border-r border-slate-200/80 px-5 py-4">
                      Category
                    </th>
                    <th className="border-r border-slate-200/80 px-5 py-4">Description</th>
                    <th className="w-[7.5rem] whitespace-nowrap px-5 py-4 text-right last:pr-6">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((tx, i) => (
                    <tr
                      key={tx.id}
                      style={{ '--tx-delay': `${Math.min(i, 14) * 38}ms` }}
                      className="tx-row-enter group border-b border-slate-200/90 transition-all duration-200 ease-out last:border-b-0 hover:bg-linear-to-r hover:from-indigo-50/70 hover:to-white hover:shadow-[inset_4px_0_0_0_#6366f1] dark:border-slate-700 dark:hover:from-indigo-950/50 dark:hover:to-slate-900"
                    >
                      <td className="whitespace-nowrap border-r border-slate-100 px-5 py-4 align-middle text-slate-600 first:pl-6 dark:border-slate-700 dark:text-slate-300">
                        {formatDate(tx.date)}
                      </td>
                      <td className="whitespace-nowrap border-r border-slate-100 px-5 py-4 text-right align-middle font-bold tabular-nums tracking-tight text-slate-900 dark:border-slate-700 dark:text-slate-50">
                        {formatNaira(tx.amount)}
                      </td>
                      <td className="whitespace-nowrap border-r border-slate-100 px-5 py-4 align-middle font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">
                        {tx.category}
                      </td>
                      <td
                        className="max-w-[14rem] truncate border-r border-slate-100 px-5 py-4 align-middle text-slate-600 dark:border-slate-700 dark:text-slate-400 sm:max-w-xs md:max-w-md"
                        title={tx.description || ''}
                      >
                        {tx.description || (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right align-middle last:pr-6">
                        <DeleteExpenseButton onClick={() => setDeleteTarget(tx)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 ? (
            <div className="tx-animate-fade-up flex flex-col items-center justify-between gap-5 rounded-2xl border border-slate-200/90 bg-white px-5 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:rounded-3xl sm:px-6">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Page{' '}
                <span className="tabular-nums font-bold text-slate-900 dark:text-slate-50">{page}</span>
                <span className="mx-1 text-slate-400 dark:text-slate-500">/</span>
                <span className="tabular-nums font-bold text-slate-900 dark:text-slate-50">{totalPages}</span>
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="min-h-10 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow active:scale-[0.98] disabled:pointer-events-none disabled:opacity-35 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="min-h-10 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow active:scale-[0.98] disabled:pointer-events-none disabled:opacity-35 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
        >
          <button
            type="button"
            className="tx-backdrop-in absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
            aria-label="Close"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <div className="tx-modal-in relative w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-7 shadow-2xl shadow-slate-900/15 dark:border-slate-700 dark:bg-slate-900 sm:rounded-3xl">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
              <TrashIcon className="h-5 w-5" />
            </div>
            <h2 id="delete-title" className="text-lg font-bold text-slate-900 dark:text-slate-50">
              Delete this expense?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              This cannot be undone. You are removing{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {formatNaira(deleteTarget.amount)}
              </span>{' '}
              in <span className="font-semibold">{deleteTarget.category}</span>
              {deleteTarget.description ? (
                <>
                  {' '}
                  <span className="text-slate-500">({deleteTarget.description})</span>
                </>
              ) : null}
              .
            </p>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-md shadow-red-900/20 transition-all duration-200 hover:bg-red-700 hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
              >
                <TrashIcon className="h-4 w-4" />
                {deleting ? 'Deleting...' : 'Delete expense'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
