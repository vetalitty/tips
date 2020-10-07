/**
 * Check pagination params
 *
 * You can sent query like:
 * http://test.com/getSmth?limit=10&skip=0
 * http://test.com/getSmth?page=2&limit=20
 * @param {object} ctx = context
 * @param {string} ctx.method = GET, POST and etc
 * @param {string} ctx.query.limit = count of rows which need to return
 * @param {string} ctx.query.skip = count of rows which need to skip
 * @param {string} ctx.query.page = which page you need
 * @param {Function} next
 * */
module.exports = (ctx, next) => {
  if (ctx.method !== 'GET') {
    return next();
  }

  const { query } = ctx;

  query.limit = parseInt(query.limit, 10) || 50;
  query.skip = query.offset = parseInt(query.offset, 10) || 0;

  if (query.page) {
    query.page = parseInt(query.page, 10);
    query.skip = query.offset = (query.page - 1) * query.limit;
  }
  return next();
};
