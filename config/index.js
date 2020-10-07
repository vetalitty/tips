const path = require('path');
const _ = require('lodash');

const ROOT = path.resolve(__dirname, '../');
const NODE_ENV = _.defaultTo(process.env.NODE_ENV, 'development');
require('dotenv').config({ path: path.join(ROOT, '.env') });

/**
 * Generate config
 *
 * return {object} config
 * */
function getConfig() {
  let config;

  switch (NODE_ENV) {
    case 'production':
      config = getProductionConfig();
      break;
    case 'development':
      config = getDevelopmentConfig();
      break;
    default:
      config = getDevelopmentConfig();
  }
  return config;
}

/**
 * Generate production config
 *
 * return {object} config
 * */
function getProductionConfig() {
  const dbConf = {
    ip: process.env.DB_IP,
    port: process.env.DB_PORT,
    pullsize: process.env.DB_PULLSIZE,
    dbname: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };

  return {
    letters: {
      email: process.env.SMTP_EMAIL,
      smtp: process.env.SMTP_SERVER,
      user: process.env.SMTP_USER,
      pswd: process.env.SMTP_PASSWORD,
      to: process.env.SMTP_COOPERATION_REQUESTS,
      template: {
        phone: process.env.TEMPLATE_PHONE,
        comment: process.env.TEMPLATE_COMMENT,
        name: process.env.TEMPLATE_NAME,
        subject: process.env.TEMPLATE_SUBJECT,
      },
    },
    server: {
      port: normalizePort(_.defaultTo(process.env.PORT, 300)),
      host: _.defaultTo(process.env.HOST, 'localhost'),
      root: ROOT,
    },
    front: {
      domain: process.env.FRONT_DOMAIN
    },
    cors: {
      origin: '*',
      exposeHeaders: ['Authorization'],
      credentials: true,
      allowMethods: ['GET', 'PUT', 'POST', 'DELETE'],
      allowHeaders: ['Authorization', 'Content-Type', 'guest'],
      keepHeadersOnError: true,
    },

    bodyParser: {
      enableTypes: ['json', 'form'],
    },

    db: {
      ip: dbConf.ip,
      port: dbConf.port,
      pullsize: dbConf.pullsize,
      dbname: dbConf.dbname,
      username: dbConf.username,
      password: dbConf.password,
      dbHost: dbConf.dbHost,
      url: `postgres://${dbConf.username}:${dbConf.password}@${dbConf.ip}:${dbConf.port}/${dbConf.dbname}`,
    },
    jwtSecret: _.defaultTo(process.env.JWT_SECRET, 'secret'),
    jwtOptions: {
      expiresIn: process.env.JWT_EXPIRES,
    },
    payment: {
      auth: {
        publicId: process.env.PAYMENT_AUTH_PUBLIC_ID,
        apiSecret: process.env.PAYMENT_AUTH_API_SECRET,
      },
      minAmount: process.env.PAYMENT_MIN_AMOUNT,
      maxAmount: process.env.PAYMENT_MAX_AMOUNT,
      url: process.env.PAYMENT_URL,
      currency: process.env.PAYMENT_CURRENCY,
      refundUrl: process.env.PAYMENT_REFUND_URL,
      topupUrl: process.env.PAYMENT_TOPUP_URL,
      refundAmount: process.env.PAYMENT_REFUND_AMOUNT,
    },
    sentryUrl: process.env.SENTRY_URL,
    logger: { level: process.env.LOG_LEVEL },
  };
}

/**
 * Generate development config
 *
 * return {object} config
 * */
function getDevelopmentConfig() {
  const dbConf = {
    ip: process.env.DB_IP,
    port: process.env.DB_PORT,
    pullsize: process.env.DB_PULLSIZE,
    dbname: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };

  return {
    letters: {
      email: process.env.SMTP_EMAIL,
      smtp: process.env.SMTP_SERVER,
      user: process.env.SMTP_USER,
      pswd: process.env.SMTP_PASSWORD,
      to: process.env.SMTP_COOPERATION_REQUESTS,
      template: {
        phone: '<b>Номер телефона:</b>',
        comment: '<b>Комментарий:</b>',
        name: '<b>Название заведение:</b>',
        subject: 'New restaurant ticket',
      },
    },
    server: {
      port: normalizePort(_.defaultTo(process.env.PORT, 3001)),
      host: _.defaultTo(process.env.HOST, 'localhost'),
      root: ROOT,
    },
    front: {
      domain: process.env.FRONT_DOMAIN
    },
    cors: {
      origin: '*',
      exposeHeaders: ['Authorization'],
      credentials: true,
      allowMethods: ['GET', 'PUT', 'POST', 'DELETE'],
      allowHeaders: ['Authorization', 'Content-Type', 'guest'],
      keepHeadersOnError: true,
    },

    bodyParser: {
      enableTypes: ['json', 'form'],
    },

    db: {
      ip: dbConf.ip,
      port: dbConf.port,
      pullsize: dbConf.pullsize,
      dbname: dbConf.dbname,
      username: dbConf.username,
      password: dbConf.password,
      url: `postgres://${dbConf.username}:${dbConf.password}@${dbConf.ip}:${dbConf.port}/${dbConf.dbname}`,
    },
    jwtSecret: _.defaultTo(process.env.JWT_SECRET, 'secret'),
    jwtOptions: {
      expiresIn: process.env.JWT_EXPIRES,
    },
    payment: {
      auth: {
        publicId: process.env.PAYMENT_AUTH_PUBLIC_ID,
        apiSecret: process.env.PAYMENT_AUTH_API_SECRET,
      },
      minAmount: process.env.PAYMENT_MIN_AMOUNT,
      maxAmount: process.env.PAYMENT_MAX_AMOUNT,
      url: process.env.PAYMENT_URL,
      currency: process.env.PAYMENT_CURRENCY,
      refundUrl: process.env.PAYMENT_REFUND_URL,
      topupUrl: process.env.PAYMENT_TOPUP_URL,
      refundAmount: process.env.PAYMENT_REFUND_AMOUNT,
    },
    sentryUrl: process.env.SENTRY_URL,
    logger: { level: process.env.LOG_LEVEL },
  };
}

module.exports = getConfig();

/**
 * Convert port to normal number
 *
 * @param {string || number} val - port
 * return {number} port || false
 * */
function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return false;
}
