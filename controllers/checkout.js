const uuid = require('uuid');
const request = require('request-promise-any');
const db = require('../database');
const config = require('../config');
const { statuses } = require('../lib/paymentStatus');
const validator = require('validator');
const { ValidationError } = require('../lib/errors');
const ERROR_CODE = require('../lib/constants').ERROR_CODE;
const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../lib/errors');
const logger = require('log4js').getLogger('controllers.checkout');
const service = require('../service');
const Sentry = require('@sentry/node');

module.exports = {
  async check(ctx) {
    logger.debug('---check---');
    let { Data } = ctx.request.body;
    const { Amount, TransactionId, AccountId } = ctx.request.body;
    logger.debug('Amount:', Amount);
    logger.debug('TransactionId:', TransactionId);
    logger.debug('AccountId:', AccountId);
    await service.checkout.check.accountId(AccountId, ctx);
    try {
      if (typeof(Data) !== 'object') {
        Data = JSON.parse(Data);
      }
    } catch (e) {
      return ctx.body = { success: false, message: 'Incorrect Data field', code: 1 };
    }
    const reviewToken = Data.saveCardToken || Data.reviewToken;
    if (!reviewToken || !validator.isUUID(reviewToken.toString())) {
      return ctx.body = { success: false, message: 'Incorrect token field', code: 1 };
    }
    const tip = await db.tips.getTip(reviewToken);
    if (!tip) {
      return ctx.body = { success: false, message: 'Cannot find the tip by token', code: 1 };
    }
    const isStatusProcessing = await db.tips.isStatus(statuses.PROCESSING, reviewToken);
    if (isStatusProcessing) {
      return ctx.body = { success: false, message: 'The transaction is already processed', code: 1 };
    }
    if (Data.guest) {
      await validateGuest(Data.guest, ctx);
      if (parseInt(Amount) >= config.payment.maxAmount) {
        return ctx.body = { success: false, message: 'Amount must be < 10000', code: 1 };
      }
      await db.tips.setStatusAmountTransactionid({
        transactionStatus: statuses.PROCESSING,
        price: parseInt(Amount) * 100,
        idTransaction: TransactionId,
      }, reviewToken);
      return ctx.body = { code: 0 };
    }
    if (Data.JWT) {
      try {
        await validateJWT(Data.JWT, ctx, config.jwtSecret);
      } catch (e) {
        return ctx.body = { success: false, code: 1 };
      }
      let transactionInfo = null;
      if (tip.transactionStatus === 'ADD_CARD_FLOW' && parseInt(Amount) === 1) transactionInfo = 'ADD_CARD_FLOW';
      await db.tips.setStatusAmountTransactionid({
        transactionInfo,
        transactionStatus: statuses.PROCESSING,
        price: parseInt(Amount) * 100,
        idTransaction: TransactionId,
      }, reviewToken);
      return ctx.body = { code: 0 };
    }
    return ctx.body = { success: false, code: 1 };
  },
  async fail(ctx) {
    logger.debug('---fail---');
    let { Data } = ctx.request.body;
    const { ReasonCode } = ctx.request.body;
    logger.debug('ReasonCode:', ReasonCode);
    try {
      if (typeof(Data) !== 'object') {
        Data = JSON.parse(Data);
      }
    } catch (e) {
      return ctx.body = { success: false, message: 'Incorrect Data field', code: 1 };
    }
    const reviewToken = Data.saveCardToken || Data.reviewToken;
    if (!reviewToken || !validator.isUUID(reviewToken.toString())) {
      return ctx.body = { success: false, message: 'Incorrect token field', code: 1 };
    }
    await db.tips.setPaymentStatus(statuses.FAIL, reviewToken);
    if (ReasonCode) {
      switch (ReasonCode) {
        case 5030:
        case 5054:
        case 5082:
        case 5091:
        case 5092:
          return ctx.body = { code: 0 };
      }
    }
    return ctx.body = { success: false, code: 1 };
  },
  async pay(ctx) {
    logger.debug('---pay---');
    let {
      Data, Token, AccountId, CardFirstSix, CardLastFour, CardType, CardExpDate,
    } = ctx.request.body;
    logger.debug('Data:', Data);
    logger.debug('Token:', Token);
    logger.debug('AccountId:', AccountId);
    logger.debug('CardFirstSix:', CardFirstSix);
    logger.debug('CardLastFour:', CardLastFour);
    logger.debug('CardType:', CardType);
    logger.debug('CardExpDate:', CardExpDate);

    try {
      Data = service.checkout.getJson(Data, ctx);

      const reviewToken = Data.saveCardToken || Data.reviewToken;
      service.checkout.check.reviewToken(reviewToken, ctx);
      await service.checkout.check.isStatusComplete(reviewToken, ctx);
      const tip = await service.checkout.check.isTipExist(reviewToken, ctx);

      let card;
      if (Token) {
        card = await service.checkout.info.card(tip.id, Token, CardFirstSix, CardLastFour, CardExpDate, CardType, AccountId, ctx);
      }

      // refund if add card flow
      if (tip.transactionInfo === statuses.ADD_CARD_FLOW) {
        await db.tips.setPaymentStatus(statuses.ADD_CARD_FLOW_REFUND_PROCESSING, reviewToken);
        if (card) {
          if (card.isNewCard) await db.card.saveCardData(card.info);

          // set waiter card
          if (tip.waiterId && !tip.visitorId) await db.waiter.setCardInfo({ cardInfo: card.info.id }, tip.waiterId);

          // set visitor card
          if (!tip.waiterId && tip.visitorId) await db.visitor.setCardInfo({ cardInfo: card.info.id }, tip.visitorId);

          await db.tips.setStatusAmountTransactionid({ paymentCard: card.info.id }, reviewToken);
        }
        return ctx.body = { code: 0 };
      }
      if (Data.guest) {
        await validateGuest(Data.guest, ctx);
        if (card) {
          const cardInfoGuest = await db.card.getCardInfo(Token);
          if (cardInfoGuest) {
            await db.tips.setStatusAmountTransactionid({ paymentCard: cardInfoGuest.id }, reviewToken);
          }
        }
        await db.tips.setPaymentStatus(statuses.COMPLETED, reviewToken);
        return ctx.body = { code: 0 };
      }

      if (Data.JWT) {
        try {
          await validateJWT(Data.JWT, ctx, config.jwtSecret);
        } catch (e) {
          throw('Incorrect JWT token');
        }
        if (card) {
          if (card.isNewCard) await db.card.saveCardData(card.info);
          await db.tips.setStatusAmountTransactionid({
            transactionStatus: statuses.COMPLETED,
            paymentCard: card.info.id,
          }, reviewToken);
        } else {
          await db.tips.setPaymentStatus(statuses.COMPLETED, reviewToken);
        }
        return ctx.body = { code: 0 };
      }
    } catch (e) {
      logger.error(e);
      return ctx.body = { code: 0 };
    }
  },

  async recurring(ctx) {
    logger.debug('---recurring---');
    const { token, amount, reviewToken } = ctx.request.body;
    logger.debug('token:', token);
    logger.debug('amount:', amount);
    let tip;
    try {
      await checkAmount(amount, ctx);
      await checkToken(token, ctx);
      service.checkout.check.reviewToken(reviewToken, ctx);
      tip = await service.checkout.check.isTipExist(reviewToken, ctx);
    } catch (e) {
      return ctx.throw(422, new ValidationError(['token, amount'], '', ERROR_CODE.INCORRECT_DATA));
    }

    let accountId;
    let card;
    try {
      card = await db.card.getCardInfoById(token);
    } catch (e) {
      return ctx.throw(422, new ValidationError(['token'], '', ERROR_CODE.NOT_EXIST));
    }
    if (card.accountId) {
      accountId = card.accountId;
    } else {
      return ctx.throw(422, new ValidationError(['accountId hasn\'t been set on pay step'], '', ERROR_CODE.INTERNAL_ERROR));
    }

    const options = {
      method: 'post',
      uri: config.payment.url,
      headers: {},
      body: {
        Amount: amount,
        Currency: config.payment.currency,
        AccountId: accountId,
        Token: card.recurringToken,
      },
      auth: {
        user: config.payment.auth.publicId,
        pass: config.payment.auth.apiSecret,
      },
      json: true,
    };
    logger.debug('options for recurring:', options);
    let cloudPaymentsResponse;
    try {
      cloudPaymentsResponse = await request(options);
    } catch (e) {
      return ctx.throw(400, new ValidationError([`Can't connect to CloudPayments`], '', ERROR_CODE.CLOUDPAYMENTS_ERROR));
    }
    cloudPaymentsErrorHandler(cloudPaymentsResponse, ctx);

    await db.tips.setStatusAmountTransactionid({
      transactionStatus: statuses.COMPLETED,
      price: amount,
      paymentCard: card.id,
    }, reviewToken);
    return ctx.body = { message: 'success' };
  },
};

function cloudPaymentsErrorHandler(cloudPaymentsResponse, ctx) {
  if (!cloudPaymentsResponse.Success && cloudPaymentsResponse.Message) {
    return ctx.throw(400, new ValidationError([cloudPaymentsResponse.Message], '', ERROR_CODE.CLOUDPAYMENTS_ERROR));
  }
  if (cloudPaymentsResponse.Model) {
    return ctx.throw(400, new ValidationError([cloudPaymentsResponse.Model.CardHolderMessage], '', ERROR_CODE.CLOUDPAYMENTS_ERROR));
  }
}

async function validateGuest(guest, ctx) {
  if (!validator.isUUID(guest.toString())) ctx.throw(422, new ValidationError(['guest'], '', ERROR_CODE.INCORRECT_DATA));
  const guestInfo = await db.guest.isUserExist(guest);
  if (!guestInfo) ctx.throw(422, new ValidationError(['guest'], '', ERROR_CODE.INCORRECT_DATA));
  guestInfo.isGuest = true;
  return guestInfo;
}

async function checkAmount(amount, ctx) {
  if (validator.isFloat(amount.toString(), {
    min: config.payment.minAmount,
    max: config.payment.maxAmount,
  })) return;
  ctx.throw(422, new ValidationError(['Out of payment range. Must be from 10 to 10000'], '', ERROR_CODE.INCORRECT_DATA));
}

async function checkToken(token, ctx) {
  if (!validator.isUUID(token.toString())) ctx.throw(422, new ValidationError(['token'], '', ERROR_CODE.INCORRECT_DATA));
}

async function checkRecurringToken(token, ctx) {
  if (validator.isLength(token.toString(), { min: 64, max: 64 })) return;
  if (validator.isAlphanumeric(token.toString())) return;
  ctx.throw(422, new ValidationError(['token'], '', ERROR_CODE.INCORRECT_DATA));
}

async function validateJWT(jwtString, ctx, jwtSecret) {
  let authData;
  try {
    authData = await jwt.verify(jwtString.split(' ')[1], jwtSecret);
  } catch (e) {
    authData = e;
  }
  if (authData.name && authData.name === 'JsonWebTokenError') {
    ctx.throw(401, new UnauthorizedError());
  }
  return authData;
}
