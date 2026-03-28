const { prisma } = require('../lib/prisma');

function parseDateOnly(value) {
  if (!value) return null;
  const s = String(value).slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
    return null;
  }
  return dt;
}

async function createExpense(req, res) {
  try {
    const { amount, category, description, date } = req.body;
    const userId = req.userId;
    if (amount === undefined || amount === null || !category) {
      return res.status(400).json({ error: 'Amount and category are required' });
    }
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    const d = parseDateOnly(date) || new Date();
    const expense = await prisma.expense.create({
      data: {
        userId,
        amount: num.toFixed(2),
        category: String(category).trim(),
        description: description != null ? String(description).trim() : '',
        date: d,
      },
    });
    return res.status(201).json({
      ...expense,
      amount: expense.amount.toString(),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Could not create expense' });
  }
}

async function listExpenses(req, res) {
  try {
    const userId = req.userId;
    const from = req.query.from;
    const toQ = req.query.to;
    const category = req.query.category;
    const where = { userId };
    if (from || toQ) {
      where.date = {};
      if (from) {
        const f = parseDateOnly(from);
        if (!f) return res.status(400).json({ error: 'Invalid from date' });
        where.date.gte = f;
      }
      if (toQ) {
        const t = parseDateOnly(toQ);
        if (!t) return res.status(400).json({ error: 'Invalid to date' });
        where.date.lte = t;
      }
    }
    if (category && String(category).trim()) {
      where.category = String(category).trim();
    }
    const rows = await prisma.expense.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return res.json(
      rows.map((e) => ({
        ...e,
        amount: e.amount.toString(),
      })),
    );
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Could not load expenses' });
  }
}

async function deleteExpense(req, res) {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const existing = await prisma.expense.findFirst({ where: { id, userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    await prisma.expense.delete({ where: { id } });
    return res.status(204).send();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Could not delete expense' });
  }
}

module.exports = { createExpense, listExpenses, deleteExpense };
