const { prisma } = require('../lib/prisma')

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}

function addMonths(d, n) {
  const x = new Date(d)
  x.setMonth(x.getMonth() + n)
  return x
}

function decimalToNumber(v) {
  return Number(v)
}

async function sumInRange(userId, start, end) {
  const agg = await prisma.expense.aggregate({
    where: { userId, date: { gte: start, lte: end } },
    _sum: { amount: true },
  })
  return decimalToNumber(agg._sum.amount || 0)
}

async function clustersInRange(userId, start, end) {
  const groups = await prisma.expense.groupBy({
    by: ['category'],
    where: { userId, date: { gte: start, lte: end } },
    _sum: { amount: true },
  })
  const out = {}
  for (const g of groups) {
    out[g.category] = decimalToNumber(g._sum.amount || 0)
  }
  return out
}

function nairaRough(n) {
  return `₦${Math.round(Number(n)).toLocaleString('en-NG')}`
}

function buildInsights(now, totalThisMonth, totalLastMonth, clustersThis, transportThis, transportLast, expenseCount) {
  const insights = []
  const catEntries = Object.entries(clustersThis).filter(([, v]) => v > 0)

  if (totalThisMonth > 0 && catEntries.length) {
    const sorted = catEntries.sort((a, b) => b[1] - a[1])
    const [topCat, topAmt] = sorted[0]
    const pct = Math.round((topAmt / totalThisMonth) * 100)
    insights.push(`${topCat} leads with ${pct}% of this month’s spending.`)
  }

  if (totalThisMonth > 0 && expenseCount > 0) {
    const dayOfMonth = now.getDate()
    const avg = totalThisMonth / dayOfMonth
    insights.push(
      `About ${nairaRough(avg)} per day on average so far, across ${expenseCount} expense${expenseCount === 1 ? '' : 's'}.`,
    )
  }

  if (catEntries.length >= 2) {
    const sorted = catEntries.sort((a, b) => b[1] - a[1])
    const [secondCat] = sorted[1]
    insights.push(`${secondCat} is your next biggest category — a good place to spot savings.`)
  } else if (totalThisMonth > 0 && catEntries.length === 1) {
    insights.push('All recorded spending is in one category this month — try splitting tags for clearer trends.')
  }

  if (insights.length < 3 && transportLast > 0) {
    const change = ((transportThis - transportLast) / transportLast) * 100
    if (Math.abs(change) >= 1) {
      const dir = change > 0 ? 'up' : 'down'
      insights.push(`Transport is ${dir} ${Math.abs(Math.round(change))}% compared with last month.`)
    }
  } else if (insights.length < 3 && transportThis > 0 && transportLast === 0) {
    insights.push('Transport costs appeared this month — worth tracking week to week.')
  }

  if (totalLastMonth > 0 && totalThisMonth > 0 && insights.length < 3) {
    const change = ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100
    if (Math.abs(change) >= 0.5) {
      insights.push(
        `Overall spending is ${change > 0 ? 'higher' : 'lower'} than last month by about ${Math.abs(Math.round(change))}%.`,
      )
    }
  }

  return insights.slice(0, 3)
}

function transportSum(clusters) {
  let t = 0
  for (const [k, v] of Object.entries(clusters)) {
    if (k.toLowerCase().includes('transport')) t += v
  }
  return t
}

/** GET /analytics/clusters — PRD shape: category → total for month (default: current) */
async function getClusters(req, res) {
  try {
    const userId = req.userId
    const now = new Date()
    let y = now.getFullYear()
    let m = now.getMonth() + 1
    if (req.query.year) y = Number(req.query.year)
    if (req.query.month) m = Number(req.query.month)
    if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
      return res.status(400).json({ error: 'Invalid year or month' })
    }
    const anchor = new Date(y, m - 1, 15)
    const start = startOfMonth(anchor)
    const end = endOfMonth(anchor)
    const clusters = await clustersInRange(userId, start, end)
    return res.json(clusters)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Could not load clusters' })
  }
}

/** GET /analytics/dashboard — totals, clusters, 6‑month trend, recent rows, insights */
async function getDashboard(req, res) {
  try {
    const userId = req.userId
    const now = new Date()
    const thisStart = startOfMonth(now)
    const thisEnd = endOfMonth(now)
    const lastStart = startOfMonth(addMonths(now, -1))
    const lastEnd = endOfMonth(addMonths(now, -1))

    const [totalThisMonth, totalLastMonth, clustersThis, clustersLast, expenseCountThisMonth, totalExpenseCount, recent] =
      await Promise.all([
        sumInRange(userId, thisStart, thisEnd),
        sumInRange(userId, lastStart, lastEnd),
        clustersInRange(userId, thisStart, thisEnd),
        clustersInRange(userId, lastStart, lastEnd),
        prisma.expense.count({
          where: { userId, date: { gte: thisStart, lte: thisEnd } },
        }),
        prisma.expense.count({ where: { userId } }),
        prisma.expense.findMany({
          where: { userId },
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          take: 10,
        }),
      ])

    const monthSlices = []
    for (let i = 5; i >= 0; i -= 1) {
      const anchor = addMonths(now, -i)
      const s = startOfMonth(anchor)
      const e = endOfMonth(anchor)
      const label = `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, '0')}`
      monthSlices.push({ label, s, e })
    }
    const trendTotals = await Promise.all(
      monthSlices.map(({ s, e }) => sumInRange(userId, s, e)),
    )
    const monthlyTrend = monthSlices.map((slice, idx) => ({
      month: slice.label,
      total: trendTotals[idx],
    }))

    const transportThis = transportSum(clustersThis)
    const transportLast = transportSum(clustersLast)
    const insights = buildInsights(
      now,
      totalThisMonth,
      totalLastMonth,
      clustersThis,
      transportThis,
      transportLast,
      expenseCountThisMonth,
    )

    let spendingChangePercent = null
    if (totalLastMonth > 0) {
      spendingChangePercent = ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100
    }

    return res.json({
      totalThisMonth,
      totalLastMonth,
      spendingChangePercent,
      expenseCountThisMonth,
      totalExpenseCount,
      clusters: clustersThis,
      monthlyTrend,
      recentTransactions: recent.map((e) => ({
        ...e,
        amount: e.amount.toString(),
      })),
      insights,
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Could not load dashboard' })
  }
}

/** Categories treated as essential (needs); rest = discretionary for health score */
const ESSENTIAL_CATEGORIES = new Set([
  'Housing',
  'Utilities',
  'Bills',
  'Health',
  'Transport',
  'Food',
  'Education',
])

function splitEssentialDiscretionary(clusters) {
  let essential = 0
  let discretionary = 0
  for (const [cat, amt] of Object.entries(clusters)) {
    const n = Number(amt) || 0
    if (ESSENTIAL_CATEGORIES.has(cat)) essential += n
    else discretionary += n
  }
  return { essential, discretionary }
}

function clampScore(n) {
  return Math.max(0, Math.min(100, Math.round(n)))
}

/**
 * Health 0–100: lower discretionary share → higher score.
 * No spending → 50 (neutral).
 */
function computeHealthScore(essential, discretionary) {
  const total = essential + discretionary
  if (total <= 0) return { score: 50, essentialPercent: 0, discretionaryPercent: 0 }
  const essentialPercent = (essential / total) * 100
  const discretionaryPercent = (discretionary / total) * 100
  const discRatio = discretionary / total
  const score = clampScore(100 - discRatio * 70)
  return { score, essentialPercent, discretionaryPercent }
}

/** GET /analytics/health-score — current month essential vs discretionary */
async function getHealthScore(req, res) {
  try {
    const userId = req.userId
    const now = new Date()
    const start = startOfMonth(now)
    const end = endOfMonth(now)
    const clusters = await clustersInRange(userId, start, end)
    const totalSpending = Object.values(clusters).reduce((s, v) => s + Number(v || 0), 0)
    const { essential, discretionary } = splitEssentialDiscretionary(clusters)
    const { score, essentialPercent, discretionaryPercent } = computeHealthScore(essential, discretionary)

    return res.json({
      score,
      totalSpending: Math.round(totalSpending * 100) / 100,
      essentialSpending: Math.round(essential * 100) / 100,
      discretionarySpending: Math.round(discretionary * 100) / 100,
      essentialPercent: Math.round(essentialPercent * 10) / 10,
      discretionaryPercent: Math.round(discretionaryPercent * 10) / 10,
      byCategory: clusters,
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Could not compute health score' })
  }
}

/** GET /analytics/insights — rolling last 30 days vs prior 30 days */
async function getInsightsAnalytics(req, res) {
  try {
    const userId = req.userId
    const end = new Date()
    end.setHours(23, 59, 59, 999)

    const last30Start = new Date(end)
    last30Start.setDate(last30Start.getDate() - 30)
    last30Start.setHours(0, 0, 0, 0)

    const prev30End = new Date(last30Start)
    prev30End.setMilliseconds(prev30End.getMilliseconds() - 1)

    const prev30Start = new Date(last30Start)
    prev30Start.setDate(prev30Start.getDate() - 30)
    prev30Start.setHours(0, 0, 0, 0)

    const [clustersLast30, totalPrev30] = await Promise.all([
      clustersInRange(userId, last30Start, end),
      sumInRange(userId, prev30Start, prev30End),
    ])

    const totalLast30 = Object.values(clustersLast30).reduce((s, v) => s + Number(v || 0), 0)

    let spendingChangePercent = null
    if (totalPrev30 > 0) {
      spendingChangePercent = ((totalLast30 - totalPrev30) / totalPrev30) * 100
    } else if (totalLast30 > 0) {
      spendingChangePercent = null
    }

    const entries = Object.entries(clustersLast30)
      .map(([name, amount]) => ({
        name,
        amount: Number(amount) || 0,
        percentOfTotal: totalLast30 > 0 ? ((Number(amount) || 0) / totalLast30) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)

    const highestCategory =
      entries.length > 0
        ? {
            name: entries[0].name,
            amount: entries[0].amount,
            percentOfTotal: Math.round(entries[0].percentOfTotal * 10) / 10,
          }
        : null

    const categoryConcentrationWarnings = entries
      .filter((e) => e.percentOfTotal > 40)
      .map((e) => ({
        category: e.name,
        percent: Math.round(e.percentOfTotal * 10) / 10,
      }))

    const messages = []
    if (highestCategory) {
      messages.push(
        `Highest spending in the last 30 days: ${highestCategory.name} (${highestCategory.percentOfTotal}% of total).`,
      )
    }
    if (spendingChangePercent !== null && Number.isFinite(spendingChangePercent)) {
      const dir = spendingChangePercent >= 0 ? 'up' : 'down'
      messages.push(
        `Total spending is ${dir} ${Math.abs(Math.round(spendingChangePercent * 10) / 10)}% vs the previous 30 days.`,
      )
    }
    for (const w of categoryConcentrationWarnings) {
      messages.push(`Warning: ${w.category} is ${w.percent}% of spending (above 40%).`)
    }

    return res.json({
      periodDays: 30,
      totalLast30Days: totalLast30,
      totalPrevious30Days: totalPrev30,
      spendingChangePercent:
        spendingChangePercent === null || !Number.isFinite(spendingChangePercent)
          ? null
          : Math.round(spendingChangePercent * 100) / 100,
      highestCategory,
      categoryConcentrationWarnings,
      messages,
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Could not load insights' })
  }
}

/** GET /analytics/prediction — optional ?budget= (monthly naira) */
async function getPrediction(req, res) {
  try {
    const userId = req.userId
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const daysInMonth = monthEnd.getDate()
    const dayOfMonth = now.getDate()

    const current_spending = await sumInRange(userId, monthStart, monthEnd)
    const daily_average = dayOfMonth > 0 ? current_spending / dayOfMonth : 0
    const predicted_spending = daily_average * daysInMonth

    let monthly_budget = null
    if (req.query.budget !== undefined && req.query.budget !== '') {
      const b = Number(req.query.budget)
      if (Number.isFinite(b) && b >= 0) monthly_budget = b
    }

    let difference_from_budget = null
    if (monthly_budget !== null) {
      difference_from_budget = monthly_budget - predicted_spending
    }

    return res.json({
      current_spending,
      predicted_spending: Math.round(predicted_spending * 100) / 100,
      daily_average: Math.round(daily_average * 100) / 100,
      days_elapsed: dayOfMonth,
      days_in_month: daysInMonth,
      monthly_budget,
      difference_from_budget:
        difference_from_budget === null ? null : Math.round(difference_from_budget * 100) / 100,
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Could not compute prediction' })
  }
}

module.exports = {
  getClusters,
  getDashboard,
  getHealthScore,
  getInsightsAnalytics,
  getPrediction,
}
