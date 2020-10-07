const db = require('../database');
const { ValidationError } = require('../lib/errors');
const handleDateParams = require('../lib/utils').handleDateParams;
const validator = require('validator');
const uuid = require('uuid');
const ERROR_CODE = require('../lib/constants').ERROR_CODE;
const jwt = require('jsonwebtoken');
const config = require('../config');
const { UnauthorizedError } = require('../lib/errors');
const { statuses } = require('../lib/paymentStatus');
const service = require('../service');

module.exports = {
  async sumTips(ctx) {
    const user = ctx.state.user;
    const { dateStart, dateEnd } = handleDateParams(ctx);

    let sum;
    const { waiter, restaurant, visitor } = ctx.query;
    if (user.type === 'ADMIN') {
      let userToken;
      if (waiter) userToken = { type: 'WAITER', id: waiter };
      if (visitor) userToken = { type: 'VISITOR', id: visitor };
      if (restaurant) {
        if (restaurant && waiter) {
          userToken = { type: 'RESTAURANT_WAITER', restaurantId: restaurant, waiterId: waiter };
        } else {
          userToken = { type: 'RESTAURANT', id: restaurant };
        }
      }

      try {
        sum = await SumTips.admin(userToken, dateStart, dateEnd);
      } catch (e) {
        ctx.throw(500, new ValidationError([], '', ERROR_CODE.INTERNAL_ERROR));
      }
    }
    if (user.type === 'WAITER') {
      sum = await SumTips.waiter(user, dateStart, dateEnd);
    }
    if (user.type === 'VISITOR') {
      sum = await SumTips.visitor(user, dateStart, dateEnd);
    }
    if (user.type === 'RESTAURANT') {
      if (waiter) {
        sum = await SumTips.restaurantWaiter({ restaurantId: user.id, waiterId: waiter }, dateStart, dateEnd);
      } else {
        sum = await SumTips.restaurant(user, dateStart, dateEnd);
      }
    }
    ctx.body = { sum: sum || 0, message: 'success' };
  },
  async paymentController(ctx) {
    const { waiterId } = ctx.request.body;
    const authToken = ctx.request.headers.authorization;
    if (authToken) {
      let res;
      try {
        res = await jwt.verify(authToken.split(' ')[1], config.jwtSecret);
      } catch (e) {
        res = e;
      }
      if (res.name && (res.name === 'JsonWebTokenError' || res.name === 'TokenExpiredError')) {
        ctx.throw(401, new UnauthorizedError());
      }
    }
    const guest = ctx.request.headers.guest;
    await Payment.validate(ctx, waiterId);
    const user = ctx.state.user || {};

    if (user.type === 'VISITOR') return Payment.forVisitor(ctx, user);
    if (guest && typeof (guest) === 'string') return Payment.forGuest(ctx);
    return Payment.forAnyone(ctx);
  },
  async review(ctx) {
    let { saveCardToken, reviewToken, message, rating } = ctx.request.body;

    if (!validator.isInt(rating.toString(), { min: 1, max: 5 })) {
      ctx.throw(422, new ValidationError(['rating must be in range from 1 to 5'], '', ERROR_CODE.INCORRECT_DATA));
    }
    reviewToken = reviewToken || saveCardToken;
    if (!reviewToken || !validator.isUUID(reviewToken.toString())) ctx.throw(422, new ValidationError(['review token'], '', ERROR_CODE.INCORRECT_DATA));
    if (!message) ctx.throw(422, new ValidationError(['message'], '', ERROR_CODE.INCORRECT_DATA));
    const isTipExist = await db.tips.isExist(reviewToken);
    if (!isTipExist) ctx.throw(422, new ValidationError(['tip'], '', ERROR_CODE.NOT_EXIST));
    const isReviewExist = await db.tips.isReviewExist(reviewToken);
    if (isReviewExist) ctx.throw(422, new ValidationError(['review'], '', ERROR_CODE.ALREADY_EXIST));
    const isStatusCompleted = await db.tips.isStatus(statuses.COMPLETED, reviewToken);
    if (!isStatusCompleted) ctx.throw(422, new ValidationError(['Transaction has not been processed'], '', ERROR_CODE.INCORRECT_DATA));

    const data = {};
    data.id = uuid.v4();
    data.message = message;
    data.rating = rating;
    await db.tips.addReview(data, reviewToken);

    ctx.body = { message: 'success' };
  },
  async getAll(ctx) {
    const user = ctx.state.user;
    const { limit, offset } = ctx.query;
    const { dateStart, dateEnd } = handleDateParams(ctx);

    let tips;
    const { waiter, restaurant, visitor } = ctx.query;
    if (user.type === 'ADMIN') {
      let userToken;
      if (waiter) userToken = { type: 'WAITER', id: waiter };
      if (visitor) userToken = { type: 'VISITOR', id: visitor };
      if (restaurant) {
        if (restaurant && waiter) {
          userToken = { type: 'RESTAURANT_WAITER', restaurantId: restaurant, waiterId: waiter };
        } else {
          userToken = { type: 'RESTAURANT', id: restaurant };
        }
      }

      try {
        tips = await ListTips.admin(userToken, dateStart, dateEnd, limit, offset);
      } catch (e) {
        ctx.throw(500, new ValidationError([], '', ERROR_CODE.INTERNAL_ERROR));
      }
    }
    if (user.type === 'WAITER') {
      tips = await ListTips.waiter(user, dateStart, dateEnd, limit, offset);
    }
    if (user.type === 'VISITOR') {
      tips = await ListTips.visitor(user, dateStart, dateEnd, limit, offset);
    }
    if (user.type === 'RESTAURANT') {
      if (waiter) {
        tips = await ListTips.restaurantWaiter({
          restaurantId: user.id,
          waiterId: waiter,
        }, dateStart, dateEnd, limit, offset);
      } else {
        tips = await ListTips.restaurant(user, dateStart, dateEnd, limit, offset);
      }
    }

    ctx.body = { ...tips, ...{ message: 'success' } };
  },
  async finalize(ctx) {
    const { waiterId } = ctx.request.body;
    const { dateStart, dateEnd } = ctx.query;

    await service.tips.validate.dateParams(ctx, dateStart, dateEnd);
    await service.waiter.validate.waiterId(ctx, waiterId);
    await service.waiter.isExist(ctx, waiterId);
    const waiterCardId = await service.waiter.check.card(ctx, waiterId);
    const card = await service.card.info.byId(waiterCardId);
    const tips = await service.tips.waiter.getAllCompleted(ctx, waiterId, dateStart, dateEnd);

    let sum = 0;
    tips.forEach(item => sum += item.price);
    if (sum === 0) return ctx.throw(400, ERROR_CODE.NOTHING_TO_PAY);

    await service.tips.transactions.transferMoney(ctx, card.recurringToken, card.accountId, sum);
    await service.tips.transactions.setPayed(tips);

    ctx.body = { message: 'success' };
  },
};

class SumTips {
  static async admin(user, dateStart, dateEnd) {
    if (!user) {
      throw new Error('waiter or restaurant or visitor');
    }
    switch (user.type) {
      case 'WAITER':
        return SumTips.waiter(user, dateStart, dateEnd);
      case 'RESTAURANT_WAITER':
        return SumTips.restaurantWaiter(user, dateStart, dateEnd);
      case 'RESTAURANT':
        return SumTips.restaurant(user, dateStart, dateEnd);
      case 'VISITOR':
        return SumTips.visitor(user, dateStart, dateEnd);
      default:
        throw new Error('waiter or restaurant or visitor');
    }
  }

  static async visitor(user, dateStart, dateEnd) {
    return db.tips.getSumTipsVisitor(user.id, dateStart, dateEnd) || 0;
  }

  static async restaurant(user, dateStart, dateEnd) {
    return db.tips.getSumTipsRestaurant(user.id, dateStart, dateEnd) || 0;
  }

  static async waiter(user, dateStart, dateEnd) {
    return db.tips.getSumTipsWaiter(user.id, dateStart, dateEnd) || 0;
  }

  static async restaurantWaiter(user, dateStart, dateEnd) {
    return db.tips.getSumTipsRestaurantWaiter(user.restaurantId, user.waiterId, dateStart, dateEnd) || 0;
  }
}

class ListTips {
  static async admin(user, dateStart, dateEnd, limit, offset) {
    if (!user) {
      throw new Error('waiter or restaurant or visitor');
    }
    switch (user.type) {
      case 'WAITER':
        return ListTips.waiter(user, dateStart, dateEnd, limit, offset);
      case 'RESTAURANT_WAITER':
        return ListTips.restaurantWaiter(user, dateStart, dateEnd, limit, offset);
      case 'RESTAURANT':
        return ListTips.restaurant(user, dateStart, dateEnd, limit, offset);
      case 'VISITOR':
        return ListTips.visitor(user, dateStart, dateEnd, limit, offset);
      default:
        throw new Error('waiter or restaurant or visitor');
    }
  }

  static async visitor(user, dateStart, dateEnd, limit, offset) {
    let result = {};
    result.tips = await db.tips.getAllTipsVisitor(user.id, dateStart, dateEnd, limit, offset);
    result.sum = await db.tips.getSumTipsVisitor(user.id, dateStart, dateEnd) || 0;
    result.avgRating = await db.tips.avgRating(user.id, dateStart, dateEnd, 'VISITOR') || 0;
    return result;
  }

  static async restaurant(user, dateStart, dateEnd, limit, offset) {
    let result = {};
    result.tips = await db.tips.getAllTipsRestaurant(user.id, dateStart, dateEnd, limit, offset);
    result.sum = await db.tips.getSumTipsRestaurant(user.id, dateStart, dateEnd) || 0;
    result.avgRating = await db.tips.avgRating(user.id, dateStart, dateEnd, 'RESTAURANT') || 0;
    return result;
  }

  static async waiter(user, dateStart, dateEnd, limit, offset) {
    let result = {};
    result.tips = await db.tips.getAllTipsWaiter(user.id, dateStart, dateEnd, limit, offset);
    result.sum = await db.tips.getSumTipsWaiter(user.id, dateStart, dateEnd) || 0;
    result.avgRating = await db.tips.avgRating(user.id, dateStart, dateEnd, 'WAITER') || 0;
    return result;
  }

  static async restaurantWaiter(user, dateStart, dateEnd, limit, offset) {
    let result = {};
    result.tips = await db.tips.getTipsRestaurantWaiter(user.restaurantId, user.waiterId, dateStart, dateEnd, limit, offset);
    result.sum = await db.tips.getSumTipsRestaurantWaiter(user.restaurantId, user.waiterId, dateStart, dateEnd) || 0;
    result.avgRating = await db.tips.avgRatingRestaurantWaiter(user.restaurantId, user.waiterId, dateStart, dateEnd) || 0;
    return result;
  }
}

class Payment {
  static async validate(ctx, waiterId) {
    if (!waiterId) ctx.throw(422, new ValidationError(['waiterId'], '', ERROR_CODE.INCORRECT_DATA));
    if (!validator.isUUID(waiterId)) ctx.throw(422, new ValidationError(['waiterId'], '', ERROR_CODE.INCORRECT_DATA));
    const isWaiterExist = await db.waiter.isUserExist(waiterId);
    if (!isWaiterExist) ctx.throw(422, new ValidationError(['waiter'], '', ERROR_CODE.NOT_EXIST));
  }

  static async forVisitor(ctx, user) {
    const { waiterId } = ctx.request.body;
    const cards = await db.tips.getAllCardsUser(user.id);

    const data = {};
    data.id = uuid.v4();
    data.waiterId = waiterId;
    data.visitorId = user.id;
    data.transactionStatus = 'INIT';
    await db.tips.putTips(data);

    ctx.body = { cards, reviewToken: data.id, message: 'success' };
  }

  static async forGuest(ctx) {
    const { waiterId } = ctx.request.body;
    const guest = ctx.request.headers.guest;
    const data = {};
    if (!validator.isUUID(guest.toString())) ctx.throw(422, new ValidationError(['guest'], '', ERROR_CODE.INCORRECT_DATA));
    const guestInfo = await db.guest.isUserExist(guest);
    if (!guestInfo) ctx.throw(422, new ValidationError(['guest'], '', ERROR_CODE.NOT_EXIST));

    data.guestId = guestInfo.id;
    data.id = uuid.v4();
    data.waiterId = waiterId;
    data.transactionStatus = 'INIT';

    await db.tips.putTips(data);

    ctx.body = { reviewToken: data.id, message: 'success' };
  }

  static async forAnyone(ctx) {
    const { guest, waiterId } = ctx.request.body;
    const data = {};
    await ctx.app.schemas.guest.validate(guest);
    const guestId = uuid.v4();
    const guestCredentials = {
      id: guestId,
      firstName: guest.firstName,
      lastName: guest.lastName,
    };
    await db.guest.register(guestCredentials);

    data.guestId = guestId;
    data.id = uuid.v4();
    data.waiterId = waiterId;
    data.transactionStatus = 'INIT';

    await db.tips.putTips(data);

    ctx.body = { guest: guestId, reviewToken: data.id, message: 'success' };
  }
}
