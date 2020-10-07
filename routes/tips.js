const Router = require('koa-router');
const ctrl = require('../controllers');

const router = new Router();

const authAdmin = require('../middleware/authAdmin');
const authAnyUser = require('../middleware/authAnyUser');
const authVisitor = require('../middleware/authVisitor');

router.post('/tips/payment', ctrl.tips.paymentController);
router.post('/tips/payment/recurring', authVisitor, ctrl.checkout.recurring);
router.post('/tips/review', ctrl.tips.review);
router.get('/tips/sum', authAnyUser, ctrl.tips.sumTips);
router.get('/tips', authAnyUser, ctrl.tips.getAll);
router.post('/tips/finalize', authAdmin, ctrl.tips.finalize);

module.exports = router.routes();
