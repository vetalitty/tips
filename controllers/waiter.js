// const uuid = require('uuid');
// const _ = require('lodash');
const { ValidationError } = require('../lib/errors');
const db = require('../database');
const handleDateParams = require('../lib/utils').handleDateParams;
const isUUID = require('is-uuid').v4;
const ERROR_CODE = require('../lib/constants').ERROR_CODE;

module.exports = {
  async register(ctx, waiterData) {
    await ctx.app.schemas.waiter.validate(waiterData);
    await db.waiter.register(waiterData);
  },
  async getAll(ctx) {
    const jwtUser = ctx.state.user;
    const { offset, limit } = ctx.query;
    let waiters;
    if (jwtUser.type === 'ADMIN') {
      waiters = await db.waiter.getAll(offset, limit);
      ctx.body = { waiters };
    }
    if (jwtUser.type === 'RESTAURANT') {
      const user = await db.restaurant.getRestaurantIdByUserId(jwtUser.id);
      if (!user) {
        ctx.throw(422, new ValidationError(['user'], '', ERROR_CODE.NOT_EXIST));
      }
      waiters = await db.waiter.listWaitersForRestaurant(jwtUser.id, offset, limit);
      ctx.body = { waiters };
    }
  },
  // async getListForRestaurant(ctx) {
  //   const jwtUser = ctx.state.user;
  //   if (jwtUser.type === 'ADMIN') {
  //     const waiters = await db.waiter.getAll(offset, limit);
  //   }
  //   const user = await db.restaurant.getRestaurantIdById(jwtUser.id);
  //   if (!user) {
  //     ctx.throw(422, new ValidationError(['is invalid'], '', 'userId'));
  //   }
  //   const {offset, limit} = ctx.query;
  //   const waiters = await db.waiter.getAll(offset, limit);
  //   ctx.body = {waiters};
  // },
  async update(ctx) {
    const { body } = ctx.request;
    checkInput(body, ctx);

    const isUserExist = await db.waiter.isUserExist(body.userId);
    if (!isUserExist) {
      ctx.throw(422, new ValidationError(['user'], '', ERROR_CODE.NOT_EXIST));
    }

    const data = {};
    data.userId = body.userId;
    data.waiter = {};
    data.users = {};
    if (body.firstName) data.waiter.firstName = body.firstName;
    if (body.lastName) data.waiter.lastName = body.lastName;
    if (body.email) data.users.email = body.email;

    await db.waiter.update(data);
    ctx.body = { message: 'success' };
  },
  async del(ctx) {
    const id = ctx.params.id;
    checkInput({ userId: id }, ctx);
    const isUserExist = await db.waiter.isUserExist(id);
    if (!isUserExist) {
      ctx.throw(422, new ValidationError(['user'], '', ERROR_CODE.NOT_EXIST));
    }
    await db.waiter.del(id);
    ctx.body = { message: 'success' };
  },
  async rating(ctx) {
    const user = ctx.state.user;
    const { dateStart, dateEnd } = handleDateParams(ctx);

    if (user.type === 'VISITOR') {
      ctx.throw(404, new ValidationError(['visitor have no access to this action'], '', ERROR_CODE.ACCESS_DENIED));
    }

    let avg;
    const { visitor, waiter, restaurant } = ctx.query;
    if (user.type === 'ADMIN') {
      let userToken;
      if (visitor) userToken = { type: 'VISITOR', id: visitor };
      if (waiter) userToken = { type: 'WAITER', id: waiter };
      if (restaurant) {
        if (restaurant && waiter) {
          userToken = { type: 'RESTAURANT_WAITER', restaurantId: restaurant, waiterId: waiter };
        } else {
          userToken = { type: 'RESTAURANT', id: restaurant };
        }
      }

      try {
        avg = await Rating.admin(userToken, dateStart, dateEnd);
      } catch (e) {
        ctx.throw(500, new ValidationError([], '', ERROR_CODE.INTERNAL_ERROR));
      }
    }
    if (user.type === 'VISITOR') {
      avg = await Rating.visitor(user, dateStart, dateEnd);
    }

    if (user.type === 'WAITER') {
      avg = await Rating.waiter(user, dateStart, dateEnd);
    }

    if (user.type === 'RESTAURANT') {
      if (waiter) {
        avg = await Rating.restaurantWaiter({ restaurantId: user.id, waiterId: waiter }, dateStart, dateEnd);
      } else {
        avg = await Rating.restaurant(user, dateStart, dateEnd);
      }
    }
    if (!avg) avg = 0;
    ctx.body = { rating: avg, message: 'success' };
  },
};

class Rating {
  static async admin(user, dateStart, dateEnd) {
    if (!user) {
      throw new Error('waiter or restaurant');
    }
    switch (user.type) {
      case 'VISITOR':
        return Rating.visitor(user, dateStart, dateEnd);
      case 'WAITER':
        return Rating.waiter(user, dateStart, dateEnd);
      case 'RESTAURANT_WAITER':
        return Rating.restaurantWaiter(user, dateStart, dateEnd);
      case 'RESTAURANT':
        return Rating.restaurant(user, dateStart, dateEnd);
      default:
        throw new Error('waiter or restaurant');
    }
  }

  static async visitor(user, dateStart, dateEnd) {
    return db.visitor.getRating(user.id, dateStart, dateEnd) || 0;
  }

  static async restaurant(user, dateStart, dateEnd) {
    return db.restaurant.getRating(user.id, dateStart, dateEnd) || 0;
  }

  static async waiter(user, dateStart, dateEnd) {
    return db.waiter.getRating(user.id, dateStart, dateEnd) || 0;
  }

  static async restaurantWaiter(user, dateStart, dateEnd) {
    return db.restaurant.getRatingRestaurantWaiter(user.waiterId, dateStart, dateEnd) || 0;
  }
}

function checkInput(params, ctx) {
  if (!params.userId) ctx.throw(422, new ValidationError(['userId'], '', ERROR_CODE.INCORRECT_DATA));
  if (!isUUID(params.userId)) ctx.throw(422, new ValidationError(['userId'], '', ERROR_CODE.INCORRECT_DATA));
}
