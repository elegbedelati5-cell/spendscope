require('dotenv').config()
const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/authRoutes')
const expenseRoutes = require('./routes/expenseRoutes')
const analyticsRoutes = require('./routes/analyticsRoutes')

const app = express()
const PORT = process.env.PORT || 4000

if (!process.env.JWT_SECRET || String(process.env.JWT_SECRET).length < 8) {
  console.error('[SpendScope] Set JWT_SECRET in backend/.env (at least 8 characters).')
  process.exit(1)
}

function parseOriginList(value) {
  if (!value || typeof value !== 'string') return []
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

const explicitOrigins = parseOriginList(process.env.FRONTEND_ORIGIN)
const isNonProduction = process.env.NODE_ENV !== 'production'
const localhostOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin) return callback(null, true)
      if (explicitOrigins.includes(origin)) return callback(null, true)
      if (isNonProduction && localhostOrigin.test(origin)) return callback(null, true)
      return callback(null, false)
    },
  }),
)
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))
app.use('/auth', authRoutes)
app.use('/expenses', expenseRoutes)
app.use('/analytics', analyticsRoutes)

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Server error' })
})

app.listen(PORT, () => {
  console.log(`SpendScope API listening on http://localhost:${PORT}`)
})
