const Router = require('koa-router');
const ctrl = require('../controllers');

const router = new Router();

router.post('/checkout/check', ctrl.checkout.check);
router.post('/checkout/pay', ctrl.checkout.pay);
router.post('/checkout/fail', ctrl.checkout.fail);

module.exports = router.routes();
