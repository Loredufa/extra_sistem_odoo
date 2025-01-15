const { Router } = require('express');
const {create_product, get_all_products, delete_product, update_product, get_product} = require('../controllers/odoo_product')
const router = Router();

router.post('/create_product', create_product)
router.get('/get_all_product', get_all_products)
router.get('/:id', get_product),
router.delete('/:id', delete_product),
router.put('/:id', update_product),


module.exports = router;