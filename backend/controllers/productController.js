const Product = require('../models/Product');

async function createProduct(req, res) {
  try {
    const { name, sku, category, price, stock, lowStockThreshold } = req.body;
    const product = await Product.create({
      name,
      sku,
      category,
      price,
      stock,
      lowStockThreshold,
      vendor: req.user._id,
    });
    return res.status(201).json(product);
  } catch (err) {
    return res.status(400).json({ message: 'Failed to create product', error: err.message });
  }
}

async function listProducts(req, res) {
  const filter = req.user.role === 'vendor' ? { vendor: req.user._id } : {};
  const products = await Product.find(filter).sort({ createdAt: -1 });
  return res.json(products);
}

async function updateStock(req, res) {
  try {
    const { delta } = req.body; // positive to restock, negative to deduct
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const newStock = product.stock + Number(delta);
    if (newStock < 0) return res.status(400).json({ message: 'Insufficient stock' });

    product.stock = newStock;
    await product.save();
    return res.json(product);
  } catch (err) {
    return res.status(400).json({ message: 'Failed to update stock', error: err.message });
  }
}

module.exports = { createProduct, listProducts, updateStock };
