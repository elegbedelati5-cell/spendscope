require('dotenv').config()
const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/authRoutes')
const expenseRoutes = require('./routes/expenseRoutes')
const analyticsRoutes = require('./routes/analyticsRoutes')

const app = express()
const PORT = process.env.PORT || 4000

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    credentials: true,
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
