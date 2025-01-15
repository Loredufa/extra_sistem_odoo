const { Router } = require('express');
const router = Router();
const verifyToken = require('../utils/middlewares/verifyToken');


const productRoute = require('./product');
const productAgentRoute = require('./prodAgent')
const adminAgentRoute = require('./admin_agent')

router.use('/product',productRoute)
router.use('/product_agent',productAgentRoute)
router.use('/admin_agent',adminAgentRoute)



module.exports = router;