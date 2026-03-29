const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { prisma } = require('../lib/prisma')

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

function trimName(raw) {
  if (raw === undefined || raw === null) return null
  const n = String(raw).trim()
  return n.length ? n.slice(0, 120) : null
}

async function register(req, res) {
  try {
    const { email, password, name } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    const normalized = String(email).trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return res.status(400).json({ error: 'Invalid email' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }
    const existing = await prisma.user.findUnique({ where: { email: normalized } })
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' })
    }
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email: normalized, passwordHash, name: trimName(name) },
      select: {
        id: true,
        email: true,
        name: true,
        currency: true,
        notifyReminders: true,
        notifyReports: true,
        createdAt: true,
      },
    })
    const token = signToken(user.id)
    return res.status(201).json({ user, token })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Registration failed' })
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    const normalized = String(email).trim().toLowerCase()
    const user = await prisma.user.findUnique({ where: { email: normalized } })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    const token = signToken(user.id)
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        currency: user.currency,
        notifyReminders: user.notifyReminders,
        notifyReports: user.notifyReports,
        createdAt: user.createdAt,
      },
      token,
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Login failed' })
  }
}

module.exports = { register, login }
