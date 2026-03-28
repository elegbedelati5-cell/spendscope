const express = require('express')
const { getClusters, getDashboard } = require('../controllers/analyticsController')
const { authMiddleware } = require('../middleware/authMiddleware')

const router = express.Router()
router.use(authMiddleware)
router.get('/clusters', getClusters)
router.get('/dashboard', getDashboard)

module.exports = router
