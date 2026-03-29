const bcrypt = require('bcryptjs')
const { prisma } = require('../lib/prisma')

const ALLOWED_CURRENCIES = new Set(['NGN', 'USD', 'EUR'])

function publicUser(u) {
  if (!u) return null
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    currency: u.currency,
    notifyReminders: u.notifyReminders,
    notifyReports: u.notifyReports,
    createdAt: u.createdAt,
  }
}

async function getMe(req, res) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) return res.status(404).json({ error: 'User not found' })
    return res.json(publicUser(user))
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Could not load profile' })
  }
}

async function updateMe(req, res) {
  try {
    const { name, currency, notifyReminders, notifyReports } = req.body
    const data = {}

    if (name !== undefined) {
      const n = String(name).trim()
      data.name = n.length ? n.slice(0, 120) : null
    }
    if (currency !== undefined) {
      const c = String(currency).trim().toUpperCase()
      if (!ALLOWED_CURRENCIES.has(c)) {
        return res.status(400).json({ error: 'Unsupported currency' })
      }
      data.currency = c
    }
    if (typeof notifyReminders === 'boolean') data.notifyReminders = notifyReminders
    if (typeof notifyReports === 'boolean') data.notifyReports = notifyReports

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
    })
    return res.json(publicUser(user))
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Could not update profile' })
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' })
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' })
    }
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user || !(await bcrypt.compare(String(currentPassword), user.passwordHash))) {
      return res.status(401).json({ error: 'Current password is incorrect' })
    }
    const passwordHash = await bcrypt.hash(String(newPassword), 10)
    await prisma.user.update({
      where: { id: req.userId },
      data: { passwordHash },
    })
    return res.json({ ok: true })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Could not change password' })
  }
}

async function deleteAccount(req, res) {
  try {
    const { password } = req.body
    if (!password) {
      return res.status(400).json({ error: 'Password is required to delete your account' })
    }
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
      return res.status(401).json({ error: 'Password is incorrect' })
    }
    await prisma.user.delete({ where: { id: req.userId } })
    return res.json({ ok: true })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Could not delete account' })
  }
}

module.exports = { getMe, updateMe, changePassword, deleteAccount }
