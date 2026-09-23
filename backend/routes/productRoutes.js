const express = require('express');
const { createProduct, listProducts, updateStock } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.post('/', authorize('admin', 'vendor'), createProduct);
router.get('/', listProducts);
router.patch('/:id/stock', authorize('admin', 'vendor'), updateStock);

module.exports = router;
