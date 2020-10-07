const ERROR_CODE = require('../lib/constants').ERROR_CODE;
const STATUSES = require('../lib/paymentStatus').statuses;
const db = require('../database');
const { ValidationError } = require('../lib/errors');
const config = require('../config');
const request = require('request-promise-any');

module.exports = {
  validate: {
    dateParams(ctx, dateStart, dateEnd) {
      const handleDateParamsStrictly = require('../lib/utils').handleDateParamsStrictly;
      try {
        handleDateParamsStrictly(dateStart, dateEnd);
      } catch (e) {
        return ctx.throw(422, new ValidationError(['cardId'], '', ERROR_CODE.INCORRECT_DATA));
      }
    }
  },
  waiter: {
    getAllCompleted(ctx, waiterId, dateStart, dateEnd) {
      return db.tips.getAllCompleted(waiterId, dateStart, dateEnd);
    },
  },
  transactions: {
    async setPayed(tips) {
      for (let i = 0; i < tips.length; i++) {
        await db.tips.setPaymentStatus(STATUSES.PAYED, tips[i].id);
      }
    },
    async transferMoney(ctx, recurringToken, accountId, sum) {
      const options = {
        method: 'post',
        uri: config.payment.topupUrl,
        headers: {},
        body: {
          Token: recurringToken,
          Amount: sum,
          AccountId: accountId,
          Currency: config.payment.currency
        },
        auth: {
          user: config.payment.auth.publicId,
          pass: config.payment.auth.apiSecret,
        },
        json: true,
      };
      let cloudPaymentsResponse;
      try {
        cloudPaymentsResponse = await request(options);
      } catch (e) {
        return ctx.throw(400, ERROR_CODE.CLOUDPAYMENTS_ERROR);
      }
      if (!cloudPaymentsResponse.Success) {
        return ctx.throw(422, new ValidationError([cloudPaymentsResponse.Message], '', ERROR_CODE.CLOUDPAYMENTS_ERROR));
      }
    }
  }
};
