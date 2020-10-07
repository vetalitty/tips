const config = require('../config');

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      database: config.db.dbname,
      user: config.db.username,
      password: config.db.password,
      host: config.db.ip,
      port: config.db.port,
    },
  },
  production: {
    client: 'postgresql',
    connection: config.db.url,
  },
};
