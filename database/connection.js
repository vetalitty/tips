const { extend } = require('pg-extra');
const pg = extend(require('pg'));
const DATABASE_URL = require('../config').db.url;

const pgPool = new pg.Pool({ connectionString: DATABASE_URL });
const getClient = () => new pg.Client({ connectionString: DATABASE_URL });
const { sql, _raw } = require('pg-extra');

module.exports = {
  pool: {
    one: arg => {
      // console.log('sql:', arg);
      return pgPool.one(arg)
    },
    many: arg => pgPool.many(arg),
    withTransaction: arg => pgPool.withTransaction(arg)
  },
  getClient,
  sql,
  _raw,
};
