const { UnauthorizedError } = require('../lib/errors');

module.exports = function (ctx, next) {
  if (!ctx.state.user) {
    ctx.throw(401, new UnauthorizedError());
  }

  if (ctx.state.user.type === 'ADMIN') {
    return next();
  }

  if (ctx.state.user.type === 'RESTAURANT') {
    return next();
  }

  ctx.throw(401, new UnauthorizedError());
};
