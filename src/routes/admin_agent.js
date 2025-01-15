const { Router } = require('express');
const {admin_agent } = require('../controllers/admin_agent')
const router = Router();

router.post('/', admin_agent)



module.exports = router;


