const validator = require('validator');
const db = require('../database');
const { ValidationError } = require('../lib/errors');

module.exports = {
  validate: {
    waiterId(ctx, waiterId) {
      if (!validator.isUUID(waiterId.toString())) {
        return ctx.throw(422, new ValidationError(['waiterId'], '', ERROR_CODE.INCORRECT_DATA));
      }
    },
  },
  isExist(ctx, waiterId){
    try {
      return db.waiter.isUserExist(waiterId);
    } catch (e) {
      return ctx.throw(422, new ValidationError(['waiter'], '', ERROR_CODE.NOT_EXIST));
    }
  },
  check: {
    async card(ctx, waiterId) {
      try {
        const waiter = await db.waiter.getInfo(waiterId);
        if (!waiter.cardInfo) throw new Error('missing card');
        return waiter.cardInfo;
      } catch (e) {
        return ctx.throw(422, new ValidationError(['card'], '', ERROR_CODE.NOT_EXIST));
      }
    }
  },

};
