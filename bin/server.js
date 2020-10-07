require('dotenv').config();
const { server: { port }, logger: { level }} = require('../config');
const log4js = require('log4js');
log4js.configure({
  appenders: { def: { type: 'console' } },
  categories: { default: { appenders: ['def'], level } }
});
const logger = log4js.getLogger('main');

const serverApp = require('../app');

/**
 * Error handling for system calls
 *
 * @param {object} error - errors
 * return {object} throw - or process.exit
 * */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  let bind;
  if (typeof port === 'string') {
    bind = `Pipe ${port}`;
  } else {
    bind = `Port ${port}`;
  }

  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`);
      return process.exit(1);
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`);
      return process.exit(1);
    default:
      throw error;
  }
}

/**
 * On listening event
 * */
function onListening() {
  logger.info(`Server has been started on port ${port}`);
}

async function start(app) {
  if (process.argv[2] === 'resetDb') {
    const resetDb = require('../sql/populate');
    try {
      const res = await resetDb();
      logger.info(res);
    } catch (e) {
      logger.error(e);
    }
    return;
  }
  app.server.listen(port);
  app.server.on('error', onError);
  app.server.on('listening', onListening);
}

start(serverApp);

module.exports = () => start(serverApp);
