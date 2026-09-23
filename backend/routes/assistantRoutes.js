const express = require('express');
const { askAboutOrders } = require('../controllers/assistantController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.post('/ask', askAboutOrders);

module.exports = router;
