const express = require('express');
const router = express.Router();
const { sendMessage, sendMonthlyMessages, getCustomerMessages, getAllMessages } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const { isAdminOrManager } = require('../middleware/rbacMiddleware');

router.post('/send', protect, sendMessage);
router.post('/send-monthly', protect, isAdminOrManager, sendMonthlyMessages);
router.get('/customer/:customerId', protect, getCustomerMessages);
router.get('/', protect, isAdminOrManager, getAllMessages);

module.exports = router;
