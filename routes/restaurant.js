const Router = require('koa-router');
const ctrl = require('../controllers');

const router = new Router();

const authRestaurant = require('../middleware/authRestaurant');
const authAdmin = require('../middleware/authAdmin');

router.post('/restaurant/register', authAdmin, ctrl.user.registerRestaurant);
router.get('/restaurant/regtoken', authRestaurant, ctrl.restaurant.getLinkWaiter);
router.get('/restaurant', authAdmin, ctrl.restaurant.getAll);
router.get('/restaurant/list/payment_verified', ctrl.restaurant.listWithAttachedCards);
router.post('/restaurant/update', authAdmin, ctrl.restaurant.update);
router.del('/restaurant/:id', authAdmin, ctrl.restaurant.del);
router.post('/restaurant/ticket', ctrl.restaurantTicket.regTicket);

module.exports = router.routes();
