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

    const [totalThisMonth, totalLastMonth, clustersThis, clustersLast, expenseCountThisMonth, recent] =
      await Promise.all([
        sumInRange(userId, thisStart, thisEnd),
        sumInRange(userId, lastStart, lastEnd),
        clustersInRange(userId, thisStart, thisEnd),
        clustersInRange(userId, lastStart, lastEnd),
        prisma.expense.count({
          where: { userId, date: { gte: thisStart, lte: thisEnd } },
        }),
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

module.exports = { getClusters, getDashboard }
