const Router = require('koa-router');
const ctrl = require('../controllers');

const router = new Router();

// const authUser = require('../middleware/authUser');
const authAdmin = require('../middleware/authAdmin');

router.post('/guest/register', ctrl.user.registerGuestAsVisitor);

module.exports = router.routes();
