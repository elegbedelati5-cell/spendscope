import { useEffect, useState } from 'react'
import api from '../api/client'
import { EXPENSE_CATEGORIES } from '../constants/categories'
import { formatDate, formatNaira } from '../utils/format'

export default function Transactions() {
  const [items, setItems] = useState([])
  const [from, setFrom] = useState('')
  const [toQ, setToQ] = useState('')
  const [category, setCategory] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  async function load() {
    setError('')
    setLoading(true)
    try {
      const params = {}
      if (from) params.from = from
      if (toQ) params.to = toQ
      if (category) params.category = category
      const { data } = await api.get('/expenses', { params })
      setItems(data)
    } catch (e) {
      setError(e.response?.data?.error || 'Could not load transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filters applied via Apply
  }, [])

  async function handleDelete(id) {
    if (!window.confirm('Delete this expense?')) return
    setDeletingId(id)
    try {
      await api.delete(`/expenses/${id}`)
      setItems((prev) => prev.filter((x) => x.id !== id))
    } catch (e) {
      setError(e.response?.data?.error || 'Could not delete')
    } finally {
      setDeletingId(null)
    }
  }

  const emptyMessage = 'No transactions match your filters.'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Transaction history</h1>
        <p className="text-sm text-slate-600">Filter by date range or category.</p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 flex-1 sm:min-w-[9rem] sm:flex-none">
          <label htmlFor="from" className="block text-xs font-medium text-slate-500">
            From
          </label>
          <input
            id="from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 w-full max-w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>
        <div className="min-w-0 flex-1 sm:min-w-[9rem] sm:flex-none">
          <label htmlFor="to" className="block text-xs font-medium text-slate-500">
            To
          </label>
          <input
            id="to"
            type="date"
            value={toQ}
            onChange={(e) => setToQ(e.target.value)}
            className="mt-1 w-full max-w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>
        <div className="min-w-0 flex-1 sm:min-w-[10rem] sm:flex-none">
          <label htmlFor="cat" className="block text-xs font-medium text-slate-500">
            Category
          </label>
          <select
            id="cat"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full max-w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          >
            <option value="">All</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 sm:w-auto sm:self-end sm:py-2"
        >
          Apply filters
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <p className="text-slate-600">Loading...</p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white py-10 text-center text-sm text-slate-500 shadow-sm">
          {emptyMessage}
        </p>
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {items.map((tx) => (
              <li
                key={tx.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-slate-900">{formatNaira(tx.amount)}</p>
                    <p className="text-sm font-medium text-slate-700">{tx.category}</p>
                    {tx.description ? (
                      <p className="mt-1 text-sm text-slate-500">{tx.description}</p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-slate-400">{formatDate(tx.date)}</p>
                    <button
                      type="button"
                      onClick={() => handleDelete(tx.id)}
                      disabled={deletingId === tx.id}
                      className="mt-2 text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="min-w-[640px] w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Date</th>
                  <th className="whitespace-nowrap px-4 py-3">Amount</th>
                  <th className="whitespace-nowrap px-4 py-3">Category</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDate(tx.date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                      {formatNaira(tx.amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{tx.category}</td>
                    <td className="max-w-[12rem] truncate px-4 py-3 text-slate-600 sm:max-w-xs md:max-w-md">
                      {tx.description || '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(tx.id)}
                        disabled={deletingId === tx.id}
                        className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
