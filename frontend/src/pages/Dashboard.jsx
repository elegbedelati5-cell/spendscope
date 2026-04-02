import { motion } from 'framer-motion'
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
import AnalyticsInsightsCard from '../components/analytics/AnalyticsInsightsCard'
import HealthScoreCard from '../components/analytics/HealthScoreCard'
import SpendingPredictionCard from '../components/analytics/SpendingPredictionCard'
import { GlassCard } from '../components/ui/GlassCard'
import { CountUpNaira } from '../components/ui/CountUp'
import BudgetNudgeToast from '../components/monetization/BudgetNudgeToast'
import SoftUpgradeTeaser from '../components/monetization/SoftUpgradeTeaser'
import UpgradeBanner from '../components/monetization/UpgradeBanner'
import UpgradeCheckoutModal from '../components/monetization/UpgradeCheckoutModal'
import { SESSION_BANNER_DISMISSED } from '../constants/monetization'
import { useAuth } from '../context/AuthContext'
import { formatDate, formatNaira } from '../utils/format'
import {
  clearPendingSoftOffer,
  getIsPremiumDemo,
  hasPendingSoftOffer,
} from '../utils/premiumStorage'
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

function analyticsLoadMessage(reason, shortLabel) {
  const detail = reason?.response?.data?.error || reason?.message
  return detail ? `${shortLabel}: ${detail}` : shortLabel
}

function SpendingChangeLine({ totalThisMonth, totalLastMonth, spendingChangePercent }) {
  if (totalThisMonth <= 0 && totalLastMonth <= 0) {
    return <p className="text-sm text-slate-600 dark:text-slate-400">No spending recorded this month yet.</p>
  }
  if (totalLastMonth <= 0 && totalThisMonth > 0) {
    return (
      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
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
          down
            ? 'bg-emerald-500/15 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
            : 'bg-amber-500/15 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200'
        }`}
      >
        <span aria-hidden>{down ? '↓' : '↑'}</span>
        {rounded}%
      </span>
      <span className="text-slate-600 dark:text-slate-400">from last month</span>
    </p>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [healthScoreData, setHealthScoreData] = useState(null)
  const [healthLoadError, setHealthLoadError] = useState(null)
  const [insights30Data, setInsights30Data] = useState(null)
  const [insightsLoadError, setInsightsLoadError] = useState(null)
  const [predictionData, setPredictionData] = useState(null)
  const [predictionLoadError, setPredictionLoadError] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [flash, setFlash] = useState(null)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [budgetToastCategory, setBudgetToastCategory] = useState(null)
  const [premiumSuccessNote, setPremiumSuccessNote] = useState(null)
  const [showSoftTeaser, setShowSoftTeaser] = useState(false)
  const [bannerDismissedSession, setBannerDismissedSession] = useState(
    () => typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_BANNER_DISMISSED) === '1',
  )

  const isPremium = getIsPremiumDemo()
  const totalCount = data?.totalExpenseCount ?? 0

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
    const st = location.state
    if (!st || typeof st !== 'object' || Object.keys(st).length === 0) return
    if (typeof st.flash === 'string' && st.flash.trim()) setFlash(st.flash.trim())
    if (st.budgetNudgeCategory) setBudgetToastCategory(st.budgetNudgeCategory)
    if (st.openUpgrade) setUpgradeModalOpen(true)
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    if (!data || isPremium) return
    if (hasPendingSoftOffer()) setShowSoftTeaser(true)
  }, [data, isPremium])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setError('')
      setLoading(true)
      setHealthLoadError(null)
      setInsightsLoadError(null)
      setPredictionLoadError(null)
      try {
        const budgetRaw =
          typeof localStorage !== 'undefined' ? localStorage.getItem('spendscope_monthly_budget') : null
        const budgetNum = budgetRaw != null && budgetRaw !== '' ? Number(budgetRaw) : NaN
        const budgetQuery =
          Number.isFinite(budgetNum) && budgetNum >= 0 ? `?budget=${encodeURIComponent(String(budgetNum))}` : ''

        const [dashR, healthR, insightsR, predR] = await Promise.allSettled([
          api.get('/analytics/dashboard'),
          api.get('/analytics/health-score'),
          api.get('/analytics/insights'),
          api.get(`/analytics/prediction${budgetQuery}`),
        ])

        if (cancelled) return

        if (dashR.status !== 'fulfilled') {
          const msg =
            dashR.reason?.response?.data?.error ||
            dashR.reason?.message ||
            'Could not load dashboard'
          setError(msg)
          setData(null)
          setHealthScoreData(null)
          setInsights30Data(null)
          setPredictionData(null)
          setHealthLoadError(null)
          setInsightsLoadError(null)
          setPredictionLoadError(null)
          return
        }

        setData(dashR.value.data)
        setHealthScoreData(healthR.status === 'fulfilled' ? healthR.value.data : null)
        setHealthLoadError(
          healthR.status === 'fulfilled'
            ? null
            : analyticsLoadMessage(healthR.reason, "Couldn't load health score"),
        )
        setInsights30Data(insightsR.status === 'fulfilled' ? insightsR.value.data : null)
        setInsightsLoadError(
          insightsR.status === 'fulfilled'
            ? null
            : analyticsLoadMessage(insightsR.reason, "Couldn't load 30-day insights"),
        )
        setPredictionData(predR.status === 'fulfilled' ? predR.value.data : null)
        setPredictionLoadError(
          predR.status === 'fulfilled'
            ? null
            : analyticsLoadMessage(predR.reason, "Couldn't load month-end forecast"),
        )
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
    return <p className="text-red-600 dark:text-red-400">{error}</p>
  }

  function dismissUpgradeBanner() {
    try {
      sessionStorage.setItem(SESSION_BANNER_DISMISSED, '1')
    } catch {
      /* ignore */
    }
    setBannerDismissedSession(true)
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 min-h-full overflow-hidden">
        <motion.div
          className="absolute -left-24 top-[-8%] h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-indigo-400/35 to-violet-400/25 blur-3xl dark:from-indigo-600/25 dark:to-violet-700/15"
          animate={{ scale: [1, 1.06, 1], x: [0, 28, 0], y: [0, 18, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -right-16 bottom-[-5%] h-[22rem] w-[22rem] rounded-full bg-gradient-to-tl from-cyan-400/30 to-indigo-400/20 blur-3xl dark:from-cyan-600/18 dark:to-indigo-700/12"
          animate={{ scale: [1, 1.05, 1], x: [0, -22, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="space-y-10 pb-4">
      <UpgradeCheckoutModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        onDeferred={() => setShowSoftTeaser(true)}
        onSubscribed={({ pdfAddOn, total }) => {
          setPremiumSuccessNote(
            pdfAddOn
              ? `Welcome to Premium + PDF reports. Demo total: ${formatNaira(total)}`
              : 'Welcome to Premium! (demo — no charge)',
          )
          setShowSoftTeaser(false)
        }}
      />

      {budgetToastCategory ? (
        <BudgetNudgeToast
          category={budgetToastCategory}
          onClose={() => setBudgetToastCategory(null)}
          onLearnMore={() => {
            setBudgetToastCategory(null)
            setUpgradeModalOpen(true)
          }}
        />
      ) : null}

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

      {premiumSuccessNote ? (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900 shadow-sm"
          role="status"
        >
          <span className="font-medium">{premiumSuccessNote}</span>
          <button
            type="button"
            onClick={() => setPremiumSuccessNote(null)}
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100"
          >
            OK
          </button>
        </div>
      ) : null}

      {!isPremium && !bannerDismissedSession ? (
        <UpgradeBanner
          expenseCount={totalCount}
          onUpgrade={() => setUpgradeModalOpen(true)}
          onDismiss={dismissUpgradeBanner}
        />
      ) : null}

      {!isPremium && showSoftTeaser ? (
        <SoftUpgradeTeaser
          onUpgrade={() => {
            setUpgradeModalOpen(true)
          }}
          onDismiss={() => {
            clearPendingSoftOffer()
            setShowSoftTeaser(false)
          }}
        />
      ) : null}

      <div className="rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-5 shadow-sm backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/85 sm:px-6 sm:py-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
              {greetingForHour()}, {firstName}
            </p>
            <p className="max-w-xl text-lg leading-relaxed text-slate-700 dark:text-slate-100">{motivationForToday()}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{monthLabel}</p>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 sm:max-w-xs sm:text-right">
            Use the <span className="font-semibold text-slate-700 dark:text-slate-200">+</span> button to log an expense.
          </p>
        </header>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <GlassCard className="relative overflow-hidden border-indigo-200/30 bg-gradient-to-br from-indigo-500/[0.08] via-white/60 to-violet-500/[0.08] p-8 dark:border-indigo-500/20 dark:from-indigo-500/15 dark:via-slate-900/40 dark:to-violet-600/15 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600/90 dark:text-indigo-400">
            Total spending · This month
          </p>
          <p className="mt-4 font-bold tracking-tight text-slate-900 text-[clamp(2.5rem,8vw,3.75rem)] leading-none dark:text-white">
            <CountUpNaira value={data.totalThisMonth} />
          </p>
          <div className="mt-5">
            <SpendingChangeLine
              totalThisMonth={data.totalThisMonth}
              totalLastMonth={data.totalLastMonth ?? 0}
              spendingChangePercent={data.spendingChangePercent}
            />
          </div>
        </GlassCard>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-2">
        <HealthScoreCard data={healthScoreData} loadError={healthLoadError} />
        <SpendingPredictionCard data={predictionData} loadError={predictionLoadError} />
      </div>

      <AnalyticsInsightsCard
        data={insights30Data}
        fallbackLines={data?.insights ?? []}
        loadError={insightsLoadError}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <motion.div whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }}>
            <Link
              to="/dashboard/add"
              state={{ presetCategory: 'Transport' }}
              className="group flex h-full flex-col gap-1 rounded-2xl border border-white/40 bg-white/50 p-4 shadow-lg backdrop-blur-xl transition hover:border-indigo-300/50 dark:border-white/10 dark:bg-slate-900/50 dark:hover:border-indigo-500/30"
            >
              <span className="text-2xl" aria-hidden>
                🚗
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-50">Log transport</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Prefills Transport category</span>
            </Link>
          </motion.div>
          <motion.div whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }}>
            <Link
              to="/dashboard/add"
              className="group flex h-full flex-col gap-1 rounded-2xl border border-white/40 bg-white/50 p-4 shadow-lg backdrop-blur-xl transition hover:border-indigo-300/50 dark:border-white/10 dark:bg-slate-900/50 dark:hover:border-indigo-500/30"
            >
              <span className="text-2xl" aria-hidden>
                ➕
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-50">Add expense</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Any category, any amount</span>
            </Link>
          </motion.div>
          <motion.div whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }}>
            <Link
              to="/dashboard/transactions"
              className="group flex h-full flex-col gap-1 rounded-2xl border border-white/40 bg-white/50 p-4 shadow-lg backdrop-blur-xl transition hover:border-indigo-300/50 dark:border-white/10 dark:bg-slate-900/50 dark:hover:border-indigo-500/30"
            >
              <span className="text-2xl" aria-hidden>
                📋
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-50">Review transactions</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Search, filter, export CSV</span>
            </Link>
          </motion.div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6 dark:border-white/10">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Spending by category</h2>
          {pieData.length === 0 ? (
            <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">No data for this month yet.</p>
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
            <ul className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-400">
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
        </GlassCard>

        <GlassCard className="p-6 dark:border-white/10">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Monthly trend</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-slate-500" stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={yAxisTick} />
                <Tooltip formatter={(v) => formatNaira(v)} />
                <Bar dataKey="total" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-6 dark:border-white/10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Recent transactions</h2>
          <Link
            to="/dashboard/transactions"
            className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            View all
          </Link>
        </div>
        {data.recentTransactions?.length ? (
          <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {data.recentTransactions.map((tx) => (
              <li key={tx.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-50">{formatNaira(tx.amount)}</p>
                  <p className="text-slate-500 dark:text-slate-400">
                    {tx.category}
                    {tx.description ? ` · ${tx.description}` : ''}
                  </p>
                </div>
                <span className="text-slate-400 dark:text-slate-500">{formatDate(tx.date)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No transactions yet.</p>
        )}
      </GlassCard>
      </div>
    </div>
  )
}
