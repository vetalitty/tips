const Router = require('koa-router');

const router = new Router();
const api = new Router();

api.use(require('./user'));
api.use(require('./restaurant'));
api.use(require('./visitor'));
api.use(require('./waiter'));
api.use(require('./tips'));
api.use(require('./checkout'));
api.use(require('./guest'));
api.use(require('./card'));

router.use('/api', api.routes());

module.exports = router;
