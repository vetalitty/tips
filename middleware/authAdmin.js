const { UnauthorizedError } = require('../lib/errors');

// ensure method for routes
module.exports = function (ctx, next) {
  if (!ctx.state.user || ctx.state.user.type !== 'ADMIN') {
    ctx.throw(401, new UnauthorizedError());
  }
  return next();
};
