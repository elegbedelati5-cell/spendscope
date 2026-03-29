import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import api from '../api/client'
import { formatDate, formatNaira } from '../utils/format'

const PIE_COLORS = ['#4F46E5', '#10B981', '#6366F1', '#14B8A6', '#8B5CF6', '#22C55E', '#EC4899', '#F59E0B']

function yAxisTick(v) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${Math.round(v / 1000)}k`
  return String(v)
}

export default function Dashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [flash, setFlash] = useState(null)

  useEffect(() => {
    const msg = location.state?.flash
    if (typeof msg === 'string' && msg.trim()) {
      setFlash(msg.trim())
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setError('')
      setLoading(true)
      try {
        const { data: d } = await api.get('/analytics/dashboard')
        if (!cancelled) setData(d)
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.error || 'Could not load dashboard')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const pieData = useMemo(() => {
    if (!data?.clusters) return []
    return Object.entries(data.clusters)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value: Number(value) }))
      .sort((a, b) => b.value - a.value)
  }, [data])

  const barData = useMemo(() => {
    if (!data?.monthlyTrend) return []
    return data.monthlyTrend.map((row) => ({
      label: row.month,
      total: Number(row.total),
    }))
  }, [data])

  if (loading) {
    return <p className="text-slate-600">Loading dashboard...</p>
  }
  if (error) {
    return <p className="text-red-600">{error}</p>
  }

  return (
    <div className="space-y-8">
      {flash ? (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-sm"
          role="status"
        >
          <span className="font-medium">{flash}</span>
          <button
            type="button"
            onClick={() => setFlash(null)}
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-600">Spending overview for this month</p>
        </div>
        <Link
          to="/dashboard/add"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          Add expense
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
          <p className="text-sm font-medium text-slate-500">Total spending (this month)</p>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            {formatNaira(data.totalThisMonth)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-800">Spending insights</h2>
          {data.insights?.length ? (
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
              {data.insights.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Add expenses to see insights.</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">Spending by category</h2>
          {pieData.length === 0 ? (
            <p className="mt-8 text-center text-sm text-slate-500">No data for this month yet.</p>
          ) : (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={96}
                    paddingAngle={2}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatNaira(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {pieData.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
              {pieData.map((row, i) => (
                <li key={row.name} className="flex items-center gap-1">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  {row.name}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">Monthly trend</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" tickFormatter={yAxisTick} />
                <Tooltip formatter={(v) => formatNaira(v)} />
                <Bar dataKey="total" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-slate-800">Recent transactions</h2>
          <Link to="/dashboard/transactions" className="text-sm font-medium text-indigo-600 hover:underline">
            View all
          </Link>
        </div>
        {data.recentTransactions?.length ? (
          <ul className="mt-4 divide-y divide-slate-100">
            {data.recentTransactions.map((tx) => (
              <li key={tx.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{formatNaira(tx.amount)}</p>
                  <p className="text-slate-500">
                    {tx.category}
                    {tx.description ? ` · ${tx.description}` : ''}
                  </p>
                </div>
                <span className="text-slate-400">{formatDate(tx.date)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-slate-500">No transactions yet.</p>
        )}
      </div>
    </div>
  )
}
