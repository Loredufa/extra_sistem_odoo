const { Router } = require('express');
const {product_agent } = require('../controllers/Product_agent')
const router = Router();

router.post('/', product_agent)



module.exports = router;