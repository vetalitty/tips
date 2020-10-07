const Router = require('koa-router');
const ctrl = require('../controllers');

const router = new Router();

const authAnyUser = require('../middleware/authAnyUser');
const authAdmin = require('../middleware/authAdmin');
const authRestaurant = require('../middleware/authRestaurant');

router.post('/waiter/register', ctrl.user.registerWaiter);
router.get('/waiter', authAnyUser, ctrl.waiter.getAll);
// router.get('/waiter/list', authRestaurant, ctrl.waiter.getListForRestaurant);
router.post('/waiter/update', authAdmin, ctrl.waiter.update);
router.del('/waiter/:id', authAdmin, ctrl.waiter.del);

module.exports = router.routes();
