const ERROR_CODE = require('../lib/constants').ERROR_CODE;
const db = require('../database');
const { ValidationError } = require('../lib/errors');
const validator = require('validator');
const { statuses } = require('../lib/paymentStatus');
const uuid = require('uuid');

module.exports = {
  check: {
    reviewToken(reviewToken, ctx) {
      if (!reviewToken || !validator.isUUID(reviewToken.toString())) {
        throw('Incorrect token field');
      }
    },
    async isStatusComplete(reviewToken, ctx) {
      const isStatusComplete = await db.tips.isStatus(statuses.COMPLETED, reviewToken);
      if (isStatusComplete) {
        throw('The transaction is already processed');
      }
    },
    async isTipExist(reviewToken, ctx) {
      const tip = await db.tips.getTip(reviewToken);
      if (!tip) {
        throw('Cannot find tip by token');
      }
      return tip;
    },
    async accountId(accountId, ctx) {
      if (!accountId || !validator.isUUID(accountId.toString())) {
        return ctx.throw(422, new ValidationError(['accountId'], '', ERROR_CODE.INCORRECT_DATA));
      }
    },
  },
  info: {
    byId(waiterCardId, ctx) {
      try {
        return db.card.getCardInfoById(waiterCardId);
      } catch (e) {
        return ctx.throw(422, new ValidationError(['waiterCardId'], '', ERROR_CODE.INCORRECT_DATA));
      }
    },
    async card(tipId, recurringToken, CardFirstSix, CardLastFour, CardExpDate, CardType, AccountId, ctx) {
      let card = {};
      let cardInfo = await db.card.getCardInfoForUser(tipId, recurringToken);
      const isNewCard = typeof cardInfo === "undefined";
      if (isNewCard) {
        cardInfo = {
          id: uuid.v4(),
          cardFirstSix: CardFirstSix,
          cardLastFour: CardLastFour,
          cardExpDate: CardExpDate,
          cardType: CardType,
          accountId: AccountId,
          recurringToken,
          userId: AccountId,
        };
      }
      card.isNewCard = isNewCard;
      card.info = cardInfo;
      return card;
    },
  },
  getJson(Data, ctx) {
    let data = Data;
    try {
      if (typeof (data) !== 'object') {
        data = JSON.parse(data);
      }
    } catch (e) {
      throw('Incorrect Data field')
    }
    return data;
  }
};
