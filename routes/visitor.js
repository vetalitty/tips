const Router = require('koa-router');
const ctrl = require('../controllers');

const router = new Router();

// const authUser = require('../middleware/authUser');
const authAdmin = require('../middleware/authAdmin');

router.post('/visitor/register', ctrl.user.registerVisitor);
router.get('/visitor', authAdmin, ctrl.visitor.get);
router.post('/visitor/update', authAdmin, ctrl.visitor.update);
router.del('/visitor/:id', authAdmin, ctrl.visitor.del);

module.exports = router.routes();
