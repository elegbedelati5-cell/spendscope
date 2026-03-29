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

function buildExpenseWhere(userId, { from, toQ, category, search }) {
  const and = [{ userId }];

  if (from || toQ) {
    const date = {};
    if (from) {
      const f = parseDateOnly(from);
      if (!f) return { error: 'Invalid from date' };
      date.gte = f;
    }
    if (toQ) {
      const t = parseDateOnly(toQ);
      if (!t) return { error: 'Invalid to date' };
      date.lte = t;
    }
    and.push({ date });
  }

  if (category && String(category).trim()) {
    and.push({ category: String(category).trim() });
  }

  const q = search != null ? String(search).trim() : '';
  if (q) {
    and.push({
      OR: [
        { description: { contains: q } },
        { category: { contains: q } },
      ],
    });
  }

  return { where: { AND: and } };
}

async function listExpenses(req, res) {
  try {
    const userId = req.userId;
    const from = req.query.from;
    const toQ = req.query.to;
    const category = req.query.category;
    const search = req.query.search;

    const built = buildExpenseWhere(userId, { from, toQ, category, search });
    if (built.error) {
      return res.status(400).json({ error: built.error });
    }
    const { where } = built;

    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const rawSize = parseInt(String(req.query.pageSize), 10) || 25;
    const pageSize = Math.min(100, Math.max(1, rawSize));
    const skip = (page - 1) * pageSize;

    const orderBy = [{ date: 'desc' }, { createdAt: 'desc' }];

    const [rows, total, agg] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.expense.count({ where }),
      prisma.expense.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    const totalAmount = Number(agg._sum.amount || 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return res.json({
      items: rows.map((e) => ({
        ...e,
        amount: e.amount.toString(),
      })),
      total,
      page,
      pageSize,
      totalPages,
      totalAmount,
    });
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
