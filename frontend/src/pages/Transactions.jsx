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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Transaction history</h1>
        <p className="text-sm text-slate-600">Filter by date range or category.</p>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <label htmlFor="from" className="block text-xs font-medium text-slate-500">
            From
          </label>
          <input
            id="from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>
        <div>
          <label htmlFor="to" className="block text-xs font-medium text-slate-500">
            To
          </label>
          <input
            id="to"
            type="date"
            value={toQ}
            onChange={(e) => setToQ(e.target.value)}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>
        <div>
          <label htmlFor="cat" className="block text-xs font-medium text-slate-500">
            Category
          </label>
          <select
            id="cat"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
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
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Apply filters
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <p className="text-slate-600">Loading...</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No transactions match your filters.
                  </td>
                </tr>
              ) : (
                items.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 text-slate-600">{formatDate(tx.date)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{formatNaira(tx.amount)}</td>
                    <td className="px-4 py-3 text-slate-700">{tx.category}</td>
                    <td className="px-4 py-3 text-slate-600">{tx.description || '-'}</td>
                    <td className="px-4 py-3 text-right">
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
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
