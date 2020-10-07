// const uuid = require('uuid');
// const _ = require('lodash');
const { ValidationError } = require('../lib/errors');
const { NotFoundError } = require('../lib/errors');
const db = require('../database');
const isUUID = require('is-uuid').v4;
const ERROR_CODE = require('../lib/constants').ERROR_CODE;

module.exports = {
  /**
   * Register restaurant
   * @param {object} ctx - context
   * @param {object} restaurantData - data for restaurant
   * @param {string} restaurantData.id - uuid v4
   * @param {string} restaurantData.name - restaurant name
   * @param {string} restaurantData.address - restaurant address
   * @param {string} restaurantData.userId - uuid v4 for user table
   * */
  async register(ctx, restaurantData) {
    await ctx.app.schemas.restaurant.validate(restaurantData);
    await db.restaurant.register(restaurantData);
  },

  /**
   * Check restaurant get query
   * @param {object} ctx - context
   * @param {string} ctx.query.restaurantId - uuid restaurant
   * @param {function} ctx.throw - throw from current request
   * @param {object} ctx.body - response body
   * */
  // async checkLink(ctx) {
  //   const {restaurantId} = ctx.query;
  //   if (!isUUID(restaurantId)) {
  //     ctx.throw(422, new ValidationError(['is invalid'], '', 'restaurant ID'));
  //   }
  //   await db.restaurant.checkRestaurantId();
  //
  //   ctx.body = {'message': 'success'};
  // },

  /**
   * List of restaurants with waiters which have attached credit cards
   * @param {object} ctx - context
   * @param {object} ctx.body - response body
   * */
  async listWithAttachedCards(ctx) {
    const { limit, offset } = ctx.query;
    const restaurants = await db.restaurant.listWithAttachedCards(limit, offset);
    ctx.body = { restaurants, message: 'success' };
  },

  async listWaitersForRestaurant(ctx) {
    const { limit, offset } = ctx.query;
    const list = await db.waiter.listWaitersForRestaurant(limit, offset);
    ctx.body = { list, message: 'success' };
  },

  /**
   * Get link for register waiter for this restaurant
   * @param {object} ctx - context
   * @param {object} ctx.body - response body
   * */
  async getLinkWaiter(ctx) {
    let { restaurantId } = ctx.query;

    // custom auth
    const user = ctx.state.user;
    if (user.type !== 'ADMIN') {
      const dbRestaurantByUser = await db.restaurant.getRestaurantIdByUserId(user.id);
      if (!dbRestaurantByUser) {
        ctx.throw(422, new ValidationError(['restaurant'], '', ERROR_CODE.NOT_EXIST));
      }
      restaurantId = dbRestaurantByUser.id;
    } else {
      if (!restaurantId) {
        ctx.throw(422, new ValidationError(['restaurant'], '', ERROR_CODE.NOT_EXIST));
      }
      const dbRestaurantByUser = await db.restaurant.getRestaurantIdByUserId(restaurantId);
      if (!dbRestaurantByUser) {
        ctx.throw(422, new ValidationError(['restaurant'], '', ERROR_CODE.NOT_EXIST));
      }
      restaurantId = dbRestaurantByUser.id;
    }
    ctx.body = { token: restaurantId };
  },
  async getAll(ctx) {
    const { offset, limit } = ctx.query;
    const restaurants = await db.restaurant.getAll(offset, limit);
    ctx.body = { restaurants };
  },
  async update(ctx) {
    const { body } = ctx.request;
    checkInput(body, ctx);

    const isUserExist = await db.restaurant.isUserExist(body.userId);
    if (!isUserExist) {
      ctx.throw(422, new ValidationError(['restaurant'], '', ERROR_CODE.NOT_EXIST));
    }

    const data = {};
    data.userId = body.userId;
    data.restaurant = {};
    data.users = {};
    if (body.name) data.restaurant.name = body.name;
    if (body.address) data.restaurant.address = body.address;
    if (body.email) data.users.email = body.email;

    await db.restaurant.update(data);
    ctx.body = { message: 'success' };
  },
  async del(ctx) {
    const id = ctx.params.id;
    checkInput({ userId: id }, ctx);
    const isUserExist = await db.restaurant.isUserExist(id);
    if (!isUserExist) {
      ctx.throw(422, new ValidationError(['restaurant'], '', ERROR_CODE.NOT_EXIST));
    }
    await db.restaurant.del(id);
    ctx.body = { message: 'success' };
  },
};

function checkInput(params, ctx) {
  if (!params.userId) ctx.throw(422, new ValidationError(['userId'], '', ERROR_CODE.INCORRECT_DATA));
  if (!isUUID(params.userId)) ctx.throw(422, new ValidationError(['userId'], '', ERROR_CODE.INCORRECT_DATA));
}
