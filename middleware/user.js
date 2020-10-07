const { has } = require('lodash');
const db = require('../database');

module.exports = async (ctx, next) => {
  if (has(ctx, 'state.jwt.sub.id')) {
    // better variant to use redis
    ctx.state.user = await db.user.getUserByEmail(ctx.state.jwt.sub.email);
  }

  return next();
};
