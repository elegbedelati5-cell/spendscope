const express = require('express')
const { createExpense, listExpenses, deleteExpense } = require('../controllers/expenseController')
const { authMiddleware } = require('../middleware/authMiddleware')

const router = express.Router()
router.use(authMiddleware)
router.post('/', createExpense)
router.get('/', listExpenses)
router.delete('/:id', deleteExpense)

module.exports = router
