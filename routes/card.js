const Router = require('koa-router');
const ctrl = require('../controllers');

const router = new Router();

const authVisitor = require('../middleware/authVisitor');
const authAnyUser = require('../middleware/authAnyUser');
const authAdmin = require('../middleware/authAdmin');

router.post('/card/remove', authVisitor, ctrl.card.remove);
router.post('/card/add', authAnyUser, ctrl.card.add);
router.post('/card/refund', authAdmin, ctrl.card.refund);

module.exports = router.routes();
