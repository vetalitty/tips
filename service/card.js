const ERROR_CODE = require('../lib/constants').ERROR_CODE;
const service = require('./waiter');
const db = require('../database');
const { ValidationError } = require('../lib/errors');

module.exports = {
  check: {
    waiter(ctx, waiterId) {
      return service.check.waiter(ctx, waiterId);
    }
  },
  info: {
    byId(waiterCardId) {
      try {
        return db.card.getCardInfoById(waiterCardId);
      } catch (e) {
        return ctx.throw(422, new ValidationError(['waiterCardId'], '', ERROR_CODE.INCORRECT_DATA));
      }
    }
  }
};
