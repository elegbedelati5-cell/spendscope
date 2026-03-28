import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { EXPENSE_CATEGORIES } from '../constants/categories'

function todayInputValue() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function AddExpense() {
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayInputValue)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/expenses', {
        amount: Number(amount),
        category,
        description,
        date,
      })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save expense')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-slate-900">Add expense</h1>
      <p className="mt-1 text-sm text-slate-600">Record a purchase or bill payment.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-slate-700">
            Amount (NGN)
          </label>
          <input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            placeholder="3500"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-slate-700">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700">
            Description
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            placeholder="Pizza"
          />
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-slate-700">
            Date
          </label>
          <input
            id="date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-60"
        >
          {loading ? 'Saving...' : 'Save expense'}
        </button>
      </form>
    </div>
  )
}
