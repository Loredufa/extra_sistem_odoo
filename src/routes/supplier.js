const { Router } = require('express');
const { create_supplier, get_all_suppliers, delete_supplier,update_supplier,get_supplier} = require('../controllers/odoo_proveedores')
const router = Router();

router.post('/create_supplier', create_supplier)
router.get('/get_all_suppliers', get_all_suppliers)
router.get('/:id', get_supplier),
router.put('/delete/:id', delete_supplier),
router.put('/:id', update_supplier),


module.exports = router;