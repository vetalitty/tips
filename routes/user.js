const Router = require('koa-router');
const ctrl = require('../controllers');

const router = new Router();

const authAnyUser = require('../middleware/authAnyUser');
// const authAdmin = require('../middleware/authAdmin');

router.post('/users/login', ctrl.user.login);
router.post('/users/password/restore', ctrl.user.forgotPassword);
router.post('/users/password/change', ctrl.user.changePassword);
router.get('/users/info', ctrl.user.info);
router.get('/users/rating', authAnyUser, ctrl.waiter.rating);

module.exports = router.routes();
