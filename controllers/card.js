const validator = require('validator');
const request = require('request-promise-any');
const uuid = require('uuid');
const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../lib/errors');
const db = require('../database');
const config = require('../config');
const { ValidationError } = require('../lib/errors');
const { ERROR_CODE } = require('../lib/constants');
const { statuses } = require('../lib/paymentStatus');

module.exports = {
  async add(ctx) {
    const authToken = ctx.request.headers.authorization;
    if (authToken) {
      let res;
      try { res = await jwt.verify(authToken.split(' ')[1], config.jwtSecret); } catch (e) { res = e; }
      if (res.name && (res.name === 'JsonWebTokenError' || res.name === 'TokenExpiredError')) { ctx.throw(401, new UnauthorizedError()); }
    }
    const user = ctx.state.user || {};
    if (user.type === 'VISITOR') return addCardVisitor(ctx);
    if (user.type === 'WAITER') return addCardWaiter(ctx);
    return ctx.throw(401, new UnauthorizedError());
  },
  async remove(ctx) {
    const { cardId } = ctx.request.body;
    if (!validator.isUUID(cardId.toString())) {
      return ctx.throw(422, new ValidationError(['cardId'], '', ERROR_CODE.INCORRECT_DATA));
    }
    try {
      await db.card.remove(cardId);
    } catch (e) {
      return ctx.throw(422, new ValidationError(['cardId'], '', ERROR_CODE.NOT_EXIST));
    }
    ctx.body = { message: 'success' };
  },
  async refund(ctx) {
    const { saveCardToken } = ctx.request.body;

    if (!saveCardToken || !validator.isUUID(saveCardToken.toString())) {
      return ctx.throw(422, new ValidationError(['saveCardToken'], '', ERROR_CODE.INCORRECT_DATA));
    }

    const isCompleted = await db.tips.isStatus(statuses.COMPLETED, saveCardToken);
    if (!isCompleted) {
      return ctx.throw(422, new ValidationError(['transaction hasn\'t been completed'], '', ERROR_CODE.INCORRECT_DATA));
    }

    const tip = await db.tips.getTip(saveCardToken);
    if (!tip) {
      return ctx.throw(422, new ValidationError(['transaction is not exist'], '', ERROR_CODE.INCORRECT_DATA));
    }
    const transactionId = parseInt(tip.idTransaction);

    const options = {
      method: 'post',
      uri: config.payment.refundUrl,
      headers: {},
      body: {
        TransactionId: transactionId,
        Amount: config.payment.refundAmount,
      },
      auth: {
        user: config.payment.auth.publicId,
        pass: config.payment.auth.apiSecret,
      },
      json: true,
    };
    const cloudPaymentsResponse = await request(options);
    if (cloudPaymentsResponse.Success) {
      await db.tips.setPaymentStatus(statuses.REFUNDED, saveCardToken);
      return ctx.body = { message: 'success' };
    }
    return ctx.throw(422, new ValidationError([cloudPaymentsResponse.Message], '', ERROR_CODE.CLOUDPAYMENTS_ERROR));
  },
};

async function addCardVisitor(ctx) {
  const data = {};
  data.id = uuid.v4();
  data.visitorId = ctx.state.user.id;
  data.transactionStatus = 'ADD_CARD_FLOW';
  try {
    await db.tips.tipAddCard(data);
  } catch (e) {
    return ctx.throw(422, new ValidationError(['can\'t to add card'], '', ERROR_CODE.INCORRECT_DATA));
  }

  ctx.body = { saveCardToken: data.id, message: 'success' };
}

async function addCardWaiter(ctx) {
  const data = {};
  data.id = uuid.v4();
  data.waiterId = ctx.state.user.id;
  data.transactionStatus = 'ADD_CARD_FLOW';
  try {
    await db.tips.tipAddCard(data);
  } catch (e) {
    return ctx.throw(422, new ValidationError(['can\'t to add card'], '', ERROR_CODE.INCORRECT_DATA));
  }

  ctx.body = { saveCardToken: data.id, message: 'success' };
}
