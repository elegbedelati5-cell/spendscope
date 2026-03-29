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
import { useAuth } from '../context/AuthContext'
import { formatDate, formatNaira } from '../utils/format'
import { getDisplayName } from '../utils/userDisplay'

const PIE_COLORS = ['#4F46E5', '#10B981', '#6366F1', '#14B8A6', '#8B5CF6', '#22C55E', '#EC4899', '#F59E0B']

const MOTIVATIONS = [
  'Every expense you log makes your picture clearer.',
  'Awareness is the first step to spending with intention.',
  'Small habits compound — keep building yours.',
  'You cannot steer what you do not measure.',
  'Clarity today saves surprises tomorrow.',
  'Your dashboard only gets smarter with every entry.',
  'Progress beats perfection — log what you can.',
]

function yAxisTick(v) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${Math.round(v / 1000)}k`
  return String(v)
}

function greetingForHour(d = new Date()) {
  const h = d.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/** One quote per calendar day (stable for the whole day; changes at midnight). */
function motivationForToday() {
  const d = new Date()
  const idx = (d.getFullYear() + d.getMonth() * 31 + d.getDate()) % MOTIVATIONS.length
  return MOTIVATIONS[idx]
}

function SpendingChangeLine({ totalThisMonth, totalLastMonth, spendingChangePercent }) {
  if (totalThisMonth <= 0 && totalLastMonth <= 0) {
    return <p className="text-sm text-slate-600">No spending recorded this month yet.</p>
  }
  if (totalLastMonth <= 0 && totalThisMonth > 0) {
    return (
      <p className="text-sm font-medium text-emerald-700">
        First spending this month — last month had nothing to compare.
      </p>
    )
  }
  if (spendingChangePercent === null || spendingChangePercent === undefined || Number.isNaN(spendingChangePercent)) {
    return null
  }
  const pct = spendingChangePercent
  const rounded = Math.abs(Math.round(pct))
  const down = pct < 0
  return (
    <p className="flex flex-wrap items-center gap-2 text-sm">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold ${
          down ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
        }`}
      >
        <span aria-hidden>{down ? '↓' : '↑'}</span>
        {rounded}%
      </span>
      <span className="text-slate-600">from last month</span>
    </p>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [flash, setFlash] = useState(null)

  const firstName = useMemo(() => {
    const full = getDisplayName(user)
    return full.split(/\s+/)[0] || full
  }, [user])
  const monthLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-NG', {
        month: 'long',
        year: 'numeric',
      }),
    [],
  )

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
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-9 max-w-md rounded-lg bg-slate-200" />
        <div className="h-40 rounded-3xl bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-24 rounded-2xl bg-slate-200" />
          <div className="h-24 rounded-2xl bg-slate-200" />
          <div className="h-24 rounded-2xl bg-slate-200" />
        </div>
        <div className="h-36 rounded-2xl bg-slate-200" />
      </div>
    )
  }
  if (error) {
    return <p className="text-red-600">{error}</p>
  }

  return (
    <div className="space-y-10 pb-4">
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

      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-indigo-600">
            {greetingForHour()}, {firstName}
          </p>
          <p className="max-w-xl text-lg leading-relaxed text-slate-700">{motivationForToday()}</p>
          <p className="text-sm text-slate-500">{monthLabel}</p>
        </div>
        <Link
          to="/dashboard/add"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700"
        >
          Add expense
        </Link>
      </header>

      <section className="rounded-3xl border border-indigo-100/80 bg-linear-to-br from-indigo-50 via-white to-violet-50 p-8 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600/90">
          Total spending · This month
        </p>
        <p className="mt-4 font-bold tracking-tight text-slate-900 text-[clamp(2.5rem,8vw,3.75rem)] leading-none">
          {formatNaira(data.totalThisMonth)}
        </p>
        <div className="mt-5">
          <SpendingChangeLine
            totalThisMonth={data.totalThisMonth}
            totalLastMonth={data.totalLastMonth ?? 0}
            spendingChangePercent={data.spendingChangePercent}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            to="/dashboard/add"
            state={{ presetCategory: 'Transport' }}
            className="group flex flex-col gap-1 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
          >
            <span className="text-2xl" aria-hidden>
              🚗
            </span>
            <span className="font-semibold text-slate-900">Log transport</span>
            <span className="text-xs text-slate-500">Prefills Transport category</span>
          </Link>
          <Link
            to="/dashboard/add"
            className="group flex flex-col gap-1 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
          >
            <span className="text-2xl" aria-hidden>
              ➕
            </span>
            <span className="font-semibold text-slate-900">Add expense</span>
            <span className="text-xs text-slate-500">Any category, any amount</span>
          </Link>
          <Link
            to="/dashboard/transactions"
            className="group flex flex-col gap-1 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
          >
            <span className="text-2xl" aria-hidden>
              📋
            </span>
            <span className="font-semibold text-slate-900">Review transactions</span>
            <span className="text-xs text-slate-500">Search, filter, export CSV</span>
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-lg text-violet-700">
            💡
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Spending insights</h2>
            <p className="text-xs text-slate-500">Based on this month so far</p>
          </div>
        </div>
        {data.insights?.length ? (
          <ul className="mt-6 space-y-4">
            {data.insights.map((line) => (
              <li key={line} className="flex gap-3 text-sm leading-relaxed text-slate-600">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-sm text-slate-500">Add expenses to see personalized insights.</p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
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

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
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

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
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
