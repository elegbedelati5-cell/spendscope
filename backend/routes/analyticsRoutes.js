const express = require('express')
const {
  getClusters,
  getDashboard,
  getHealthScore,
  getInsightsAnalytics,
  getPrediction,
} = require('../controllers/analyticsController')
const { authMiddleware } = require('../middleware/authMiddleware')

const router = express.Router()
router.use(authMiddleware)
router.get('/clusters', getClusters)
router.get('/dashboard', getDashboard)
router.get('/health-score', getHealthScore)
router.get('/insights', getInsightsAnalytics)
router.get('/prediction', getPrediction)

module.exports = router
