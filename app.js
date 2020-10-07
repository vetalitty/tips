const http = require('http');

// 3rd party
const Koa = require('koa');

const app = new Koa();
const logger = require('koa-logger');
const cors = require('kcors');
const bodyParser = require('koa-bodyparser');
const config = require('./config');

// 1st party
require('./schemas')(app);
const routes = require('./routes');
const errorMiddleware = require('./middleware/error');
const jwtMiddleware = require('./middleware/jwt');
const userMiddleware = require('./middleware/user');
const paginationMiddleware = require('./middleware/pagination');

app.use(logger());
app.use(errorMiddleware);

app.use(cors(config.cors));
app.use(bodyParser(config.bodyParser));

app.use(jwtMiddleware);
app.use(userMiddleware);
app.use(paginationMiddleware);

app.use(routes.routes());
app.use(routes.allowedMethods());

app.server = require('http-shutdown')(http.createServer(app.callback()));

app.shutDown = function shutDown() {
  console.log('Shutdown');
};

module.exports = app;
