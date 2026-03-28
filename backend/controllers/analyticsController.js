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

function buildInsights(totalThisMonth, clustersThis, transportThis, transportLast) {
  const insights = []
  if (totalThisMonth > 0 && Object.keys(clustersThis).length) {
    const sorted = Object.entries(clustersThis).sort((a, b) => b[1] - a[1])
    const [topCat, topAmt] = sorted[0]
    const pct = Math.round((topAmt / totalThisMonth) * 100)
    insights.push(`You spent ${pct}% of your money on ${topCat} this month.`)
  }
  if (transportLast > 0) {
    const change = ((transportThis - transportLast) / transportLast) * 100
    if (Math.abs(change) >= 1) {
      const dir = change > 0 ? 'increased' : 'decreased'
      insights.push(`Transport spending ${dir} by ${Math.abs(Math.round(change))}% vs last month.`)
    }
  } else if (transportThis > 0 && transportLast === 0) {
    insights.push('You had no transport spending last month; this month has new transport costs.')
  }
  return insights
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

    const [totalThisMonth, clustersThis, clustersLast, recent] = await Promise.all([
      sumInRange(userId, thisStart, thisEnd),
      clustersInRange(userId, thisStart, thisEnd),
      clustersInRange(userId, lastStart, lastEnd),
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
    const insights = buildInsights(totalThisMonth, clustersThis, transportThis, transportLast)

    return res.json({
      totalThisMonth,
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
