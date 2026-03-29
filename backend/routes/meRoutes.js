const express = require('express')
const { authMiddleware } = require('../middleware/authMiddleware')
const { getMe, updateMe, changePassword, deleteAccount } = require('../controllers/userController')

const router = express.Router()
router.use(authMiddleware)

router.get('/', getMe)
router.patch('/', updateMe)
router.post('/password', changePassword)
router.delete('/', deleteAccount)

module.exports = router
