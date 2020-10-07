const knex = require('knex')({ client: 'pg' });
const { pool, _raw } = require('./connection');
const _ = require('lodash');
const table = require('./tables');
const { statuses } = require('../lib/paymentStatus');

module.exports = {
  avgRating: async(id, dateStart, dateEnd, userType) => {
    let tableUser;
    if (userType === 'VISITOR') tableUser = `${table.tipInfo}.visitorId`;
    if (userType === 'WAITER') tableUser = `${table.waiter}.userId`;
    if (userType === 'RESTAURANT') tableUser = `${table.restaurant}.userId`;
    const query = knex(table.tipInfo)
      .join(table.waiter, `${table.waiter}.userId`, `${table.tipInfo}.waiterId`)
      .leftJoin(table.visitor, `${table.visitor}.userId`, `${table.tipInfo}.visitorId`)
      .join(table.restaurant, `${table.restaurant}.id`, `${table.waiter}.restaurantId`)
      .leftJoin(table.review, `${table.tipInfo}.reviewId`, `${table.review}.id`)
      .leftJoin(table.guest, `${table.tipInfo}.guestId`, `${table.guest}.id`)
      .where(`${table.tipInfo}.isDelete`, false)
      .where(`${table.waiter}.isDelete`, false)
      .where(`${table.restaurant}.isDelete`, false)
      .where(function () {
        this.where(`${table.visitor}.isDelete`, false).orWhere(`${table.visitor}.isDelete`, null);
      })
      .where(`${table.tipInfo}.created_at`, '>=', dateStart)
      .where(`${table.tipInfo}.created_at`, '<=', dateEnd)
      .where(tableUser, id)
      .where(`${table.tipInfo}.transactionStatus`, statuses.COMPLETED)
      .avg(`${table.review}.rating`)
      .toString();
    return (await pool.one(_raw`${query}`)).avg;
  },
  avgRatingRestaurantWaiter: async(restaurantId, waiterId, dateStart, dateEnd) => {
    const query = knex(table.tipInfo)
      .join(table.waiter, `${table.waiter}.userId`, `${table.tipInfo}.waiterId`)
      .leftJoin(table.visitor, `${table.visitor}.userId`, `${table.tipInfo}.visitorId`)
      .join(table.restaurant, `${table.restaurant}.id`, `${table.waiter}.restaurantId`)
      .leftJoin(table.review, `${table.tipInfo}.reviewId`, `${table.review}.id`)
      .leftJoin(table.guest, `${table.tipInfo}.guestId`, `${table.guest}.id`)
      .where(`${table.tipInfo}.isDelete`, false)
      .where(`${table.waiter}.isDelete`, false)
      .where(`${table.restaurant}.isDelete`, false)
      .where(function () {
        this.where(`${table.visitor}.isDelete`, false).orWhere(`${table.visitor}.isDelete`, null);
      })
      .where(`${table.tipInfo}.created_at`, '>=', dateStart)
      .where(`${table.tipInfo}.created_at`, '<=', dateEnd)
      .where(`${table.restaurant}.userId`, restaurantId)
      .where(`${table.waiter}.userId`, waiterId)
      .where(`${table.tipInfo}.transactionStatus`, statuses.COMPLETED)
      .avg(`${table.review}.rating`)
      .toString();
    return (await pool.one(_raw`${query}`)).avg;
  },
  getSumTipsWaiter: async(id, dateStart, dateEnd) => {
    const query = knex(table.tipInfo)
      .where(`${table.tipInfo}.isDelete`, false)
      .andWhere(`${table.tipInfo}.waiterId`, id)
      .andWhere(`${table.tipInfo}.created_at`, '>=', dateStart)
      .andWhere(`${table.tipInfo}.created_at`, '<=', dateEnd)
      .andWhere(`${table.tipInfo}.transactionStatus`, statuses.COMPLETED)
      .sum(`${table.tipInfo}.price`)
      .toString();
    const res = await pool.one(_raw`${query}`);
    if (res.sum) res.sum /= 100;
    return res.sum;
  },
  getSumTipsVisitor: async(id, dateStart, dateEnd) => {
    const query = knex(table.tipInfo)
      .where(`${table.tipInfo}.isDelete`, false)
      .andWhere(`${table.tipInfo}.visitorId`, id)
      .andWhere(`${table.tipInfo}.created_at`, '>=', dateStart)
      .andWhere(`${table.tipInfo}.created_at`, '<=', dateEnd)
      .andWhere(`${table.tipInfo}.transactionStatus`, statuses.COMPLETED)
      .sum(`${table.tipInfo}.price`)
      .toString();
    const res = await pool.one(_raw`${query}`);
    if (res.sum) res.sum /= 100;
    return res.sum;
  },
  getSumTipsRestaurant: async(id, dateStart, dateEnd) => {
    const query = knex(table.tipInfo)
      .join(table.waiter, `${table.tipInfo}.waiterId`, `${table.waiter}.userId`)
      .join(table.restaurant, `${table.waiter}.restaurantId`, `${table.restaurant}.id`)
      .where(`${table.tipInfo}.isDelete`, false)
      .andWhere(`${table.waiter}.isDelete`, false)
      .andWhere(`${table.restaurant}.isDelete`, false)
      .andWhere(`${table.restaurant}.userId`, id)
      .andWhere(`${table.tipInfo}.created_at`, '>=', dateStart)
      .andWhere(`${table.tipInfo}.created_at`, '<=', dateEnd)
      .andWhere(`${table.tipInfo}.transactionStatus`, statuses.COMPLETED)
      .sum(`${table.tipInfo}.price`)
      .toString();
    const res = await pool.one(_raw`${query}`);
    if (res.sum) res.sum /= 100;
    return res.sum;
  },
  getSumTipsRestaurantWaiter: async(restaurantId, waiterId, dateStart, dateEnd) => {
    const query = knex(table.tipInfo)
      .join(table.waiter, `${table.tipInfo}.waiterId`, `${table.waiter}.userId`)
      .join(table.restaurant, `${table.waiter}.restaurantId`, `${table.restaurant}.id`)
      .where(`${table.tipInfo}.isDelete`, false)
      .andWhere(`${table.waiter}.isDelete`, false)
      .andWhere(`${table.restaurant}.isDelete`, false)
      .andWhere(`${table.restaurant}.userId`, restaurantId)
      .andWhere(`${table.waiter}.userId`, waiterId)
      .andWhere(`${table.tipInfo}.created_at`, '>=', dateStart)
      .andWhere(`${table.tipInfo}.created_at`, '<=', dateEnd)
      .andWhere(`${table.tipInfo}.transactionStatus`, statuses.COMPLETED)
      .sum(`${table.tipInfo}.price`)
      .toString();
    const res = await pool.one(_raw`${query}`);
    if (res.sum) res.sum /= 100;
    return res.sum;
  },
  getAllTipsWaiter: async(id, dateStart, dateEnd, limit, offset) => {
    const query = knex(table.tipInfo)
      .join(table.waiter, `${table.waiter}.userId`, `${table.tipInfo}.waiterId`)
      .leftJoin(table.visitor, `${table.visitor}.userId`, `${table.tipInfo}.visitorId`)
      .join(table.restaurant, `${table.restaurant}.id`, `${table.waiter}.restaurantId`)
      .leftJoin(table.review, `${table.tipInfo}.reviewId`, `${table.review}.id`)
      .leftJoin(table.guest, `${table.tipInfo}.guestId`, `${table.guest}.id`)
      .select(
        `${table.visitor}.firstName as visitorFirstName`,
        `${table.visitor}.lastName as visitorLastName`,
        `${table.restaurant}.name as restaurantName`,
        `${table.restaurant}.address as restaurantAddress`,
        `${table.tipInfo}.created_at as date`,
        `${table.tipInfo}.price as price`,
        `${table.review}.rating as rating`,
        `${table.review}.message as comment`,
        `${table.guest}.firstName as guestFirstName`,
        `${table.guest}.lastName as guestLastName`,
      )
      .where(`${table.tipInfo}.isDelete`, false)
      .where(`${table.waiter}.isDelete`, false)
      .where(`${table.restaurant}.isDelete`, false)
      .where(function () {
        this.where(`${table.visitor}.isDelete`, false).orWhere(`${table.visitor}.isDelete`, null);
      })
      .where(`${table.tipInfo}.created_at`, '>=', dateStart)
      .where(`${table.tipInfo}.created_at`, '<=', dateEnd)
      .where(`${table.waiter}.userId`, id)
      .where(`${table.tipInfo}.transactionStatus`, statuses.COMPLETED)
      .offset(offset)
      .limit(limit)
      .orderBy(`${table.tipInfo}.created_at`, 'desc')
      .toString();
    let tips = await pool.many(_raw`${query}`);
    tips = handlingListOfResults(tips);
    return tips;
  },
  getAllTipsVisitor: async(id, dateStart, dateEnd, limit, offset) => {
    const query = knex(table.tipInfo)
      .join(table.waiter, `${table.waiter}.userId`, `${table.tipInfo}.waiterId`)
      .leftJoin(table.visitor, `${table.visitor}.userId`, `${table.tipInfo}.visitorId`)
      .join(table.restaurant, `${table.restaurant}.id`, `${table.waiter}.restaurantId`)
      .leftJoin(table.review, `${table.tipInfo}.reviewId`, `${table.review}.id`)
      .leftJoin(table.guest, `${table.tipInfo}.guestId`, `${table.guest}.id`)
      .select(
        `${table.waiter}.firstName as waiterFirstName`,
        `${table.waiter}.lastName as waiterLastName`,
        `${table.restaurant}.name as restaurantName`,
        `${table.restaurant}.address as restaurantAddress`,
        `${table.tipInfo}.created_at as date`,
        `${table.tipInfo}.price as price`,
        `${table.review}.rating as rating`,
        `${table.review}.message as comment`,
        `${table.guest}.firstName as guestFirstName`,
        `${table.guest}.lastName as guestLastName`,
      )
      .where(`${table.tipInfo}.isDelete`, false)
      .where(`${table.waiter}.isDelete`, false)
      .where(`${table.restaurant}.isDelete`, false)
      .where(`${table.visitor}.isDelete`, false)
      .where(`${table.tipInfo}.created_at`, '>=', dateStart)
      .where(`${table.tipInfo}.created_at`, '<=', dateEnd)
      .where(`${table.tipInfo}.visitorId`, id)
      .andWhere(`${table.tipInfo}.transactionStatus`, statuses.COMPLETED)
      .where(function () {
        this.where(`${table.visitor}.isDelete`, false).orWhere(`${table.visitor}.isDelete`, null);
      })
      .offset(offset)
      .limit(limit)
      .orderBy(`${table.tipInfo}.created_at`, 'desc')
      .toString();
    let tips = await pool.many(_raw`${query}`);
    tips = handlingListOfResults(tips);
    return tips;
  },
  getAllTipsRestaurant: async(id, dateStart, dateEnd, limit, offset) => {
    const query = knex(table.tipInfo)
      .join(table.waiter, `${table.waiter}.userId`, `${table.tipInfo}.waiterId`)
      .leftJoin(table.visitor, `${table.visitor}.userId`, `${table.tipInfo}.visitorId`)
      .join(table.restaurant, `${table.restaurant}.id`, `${table.waiter}.restaurantId`)
      .leftJoin(table.review, `${table.tipInfo}.reviewId`, `${table.review}.id`)
      .leftJoin(table.guest, `${table.tipInfo}.guestId`, `${table.guest}.id`)
      .select(
        `${table.waiter}.firstName as waiterFirstName`,
        `${table.waiter}.lastName as waiterLastName`,
        `${table.visitor}.firstName as visitorFirstName`,
        `${table.visitor}.lastName as visitorLastName`,
        `${table.restaurant}.name as restaurantName`,
        `${table.restaurant}.address as restaurantAddress`,
        `${table.tipInfo}.created_at as date`,
        `${table.tipInfo}.price as price`,
        `${table.review}.rating as rating`,
        `${table.review}.message as comment`,
        `${table.guest}.firstName as guestFirstName`,
        `${table.guest}.lastName as guestLastName`,
      )
      .where(`${table.tipInfo}.isDelete`, false)
      .where(`${table.waiter}.isDelete`, false)
      .where(`${table.restaurant}.isDelete`, false)
      .where(function () {
        this.where(`${table.visitor}.isDelete`, false).orWhere(`${table.visitor}.isDelete`, null);
      })
      .where(`${table.tipInfo}.created_at`, '>=', dateStart)
      .where(`${table.tipInfo}.created_at`, '<=', dateEnd)
      .where(`${table.restaurant}.userId`, id)
      .andWhere(`${table.tipInfo}.transactionStatus`, statuses.COMPLETED)
      .offset(offset)
      .limit(limit)
      .orderBy(`${table.tipInfo}.created_at`, 'desc')
      .toString();
    let tips = await pool.many(_raw`${query}`);
    tips = handlingListOfResults(tips);
    return tips;
  },
  getTipsRestaurantWaiter: async(restaurantId, waiterId, dateStart, dateEnd, limit, offset) => {
    const query = knex(table.tipInfo)
      .join(table.waiter, `${table.waiter}.userId`, `${table.tipInfo}.waiterId`)
      .leftJoin(table.visitor, `${table.visitor}.userId`, `${table.tipInfo}.visitorId`)
      .join(table.restaurant, `${table.restaurant}.id`, `${table.waiter}.restaurantId`)
      .leftJoin(table.review, `${table.tipInfo}.reviewId`, `${table.review}.id`)
      .leftJoin(table.guest, `${table.tipInfo}.guestId`, `${table.guest}.id`)
      .select(
        `${table.waiter}.firstName as waiterFirstName`,
        `${table.waiter}.lastName as waiterLastName`,
        `${table.visitor}.firstName as visitorFirstName`,
        `${table.visitor}.lastName as visitorLastName`,
        `${table.restaurant}.name as restaurantName`,
        `${table.restaurant}.address as restaurantAddress`,
        `${table.tipInfo}.created_at as date`,
        `${table.tipInfo}.price as price`,
        `${table.review}.rating as rating`,
        `${table.review}.message as comment`,
        `${table.guest}.firstName as guestFirstName`,
        `${table.guest}.lastName as guestLastName`,
      )
      .where(`${table.tipInfo}.isDelete`, false)
      .where(`${table.waiter}.isDelete`, false)
      .where(`${table.restaurant}.isDelete`, false)
      .where(function () {
        this.where(`${table.visitor}.isDelete`, false).orWhere(`${table.visitor}.isDelete`, null);
      })
      .where(`${table.tipInfo}.created_at`, '>=', dateStart)
      .where(`${table.tipInfo}.created_at`, '<=', dateEnd)
      .where(`${table.restaurant}.userId`, restaurantId)
      .where(`${table.waiter}.userId`, waiterId)
      .andWhere(`${table.tipInfo}.transactionStatus`, statuses.COMPLETED)
      .offset(offset)
      .limit(limit)
      .orderBy(`${table.tipInfo}.created_at`, 'desc')
      .toString();
    let tips = await pool.many(_raw`${query}`);
    tips = handlingListOfResults(tips);
    return tips;
  },
  putTips: async(data) => {
    const qRestaurant = knex(table.restaurant)
      .join(table.waiter, `${table.waiter}.restaurantId`, `${table.restaurant}.id`)
      .select(
        `${table.restaurant}.userId`,
      )
      .where(`${table.waiter}.isDelete`, false)
      .where(`${table.restaurant}.isDelete`, false)
      .where(`${table.waiter}.userId`, data.waiterId)
      .toString();
    const restaurant = await pool.one(_raw`${qRestaurant}`);
    if (!restaurant) {
      throw new Error('Restaurant for this waiter is not exist');
    }

    const query = knex(table.tipInfo)
      .insert(data)
      .toString();
    return pool.one(_raw`${query}`);
  },
  tipAddCard: async(data) => {
    const query = knex(table.tipInfo)
      .insert(data)
      .toString();
    return pool.one(_raw`${query}`);
  },
  isExist: async(id) => {
    const query = knex(table.tipInfo)
      .where(`${table.tipInfo}.isDelete`, false)
      .where(`${table.tipInfo}.id`, id)
      .count()
      .toString();
    const res = await pool.one(_raw`${query}`);
    if (res.count !== 0) return true;
  },
  isReviewExist: async(id) => {
    const query = knex(table.tipInfo)
      .where(`${table.tipInfo}.isDelete`, false)
      .where(`${table.tipInfo}.id`, id)
      .toString();
    const res = await pool.one(_raw`${query}`);
    if (res.reviewId === '00000000-0000-0000-0000-000000000000') return false;
    if (!res.reviewId) return false;
    return true;
  },
  addReview: async(data, tipId) => {
    let mainQuery = '';
    const qRating = knex(table.review)
      .insert(data)
      .toString();
    mainQuery += `${qRating};\n`;

    const qTips = knex(table.tipInfo)
      .where({ id: tipId })
      .update({ reviewId: data.id })
      .toString();
    mainQuery += `${qTips};\n`;

    if (!mainQuery) return;
    mainQuery = _raw`${mainQuery}`;

    return pool.withTransaction(client => client.query(mainQuery));
  },
  getAllCardsUser: async(userId) => {
    const query = knex(table.card)
      .join(table.users, `${table.users}.id`, `${table.card}.userId`)
      .select(
        `${table.card}.id as recurringToken`,
        `${table.card}.id as id`,
        `${table.card}.cardFirstSix as cardFirstSix`,
        `${table.card}.cardLastFour as cardLastFour`,
        `${table.card}.cardExpDate as cardExpDate`,
        `${table.card}.cardType as cardType`,
      )
      .where(`${table.card}.isDelete`, false)
      .where(`${table.users}.isDelete`, false)
      .where(`${table.users}.id`, userId)
      .toString();
    return pool.many(_raw`${query}`);
  },
  getAllCardsGuest: async(guestId) => {
    const query = knex(table.card)
      .join(table.guest, `${table.guest}.id`, `${table.card}.guestId`)
      .select(
        `${table.card}.id as id`,
        `${table.card}.cardFirstSix as cardFirstSix`,
        `${table.card}.cardLastFour as cardLastFour`,
        `${table.card}.cardExpDate as cardExpDate`,
        `${table.card}.cardType as cardType`,
        `${table.card}.accountId as accountId`,
        `${table.card}.recurringToken as recurringToken`,
      )
      .where(`${table.card}.isDelete`, false)
      .where(`${table.guest}.isDelete`, false)
      .where(`${table.guest}.id`, guestId)
      .toString();
    return pool.many(_raw`${query}`);
  },
  setPaymentStatus: async(status, tipId) => {
    const query = knex(table.tipInfo)
      .where({ id: tipId })
      .update({ transactionStatus: status })
      .toString();
    return pool.one(_raw`${query}`);
  },
  setStatusAmountTransactionid: async(data, tipId) => {
    const query = knex(table.tipInfo)
      .where({ id: tipId })
      .update(data)
      .toString();
    return pool.one(_raw`${query}`);
  },
  isStatus: async(status, tipId) => {
    const query = knex(table.tipInfo)
      .count()
      .where({
        transactionStatus: status,
        id: tipId,
      })
      .toString();
    const res = await pool.one(_raw`${query}`);
    if (res.count !== 0) return true;
  },
  setAmount: async(price, tipId) => {
    const query = knex(table.tipInfo)
      .where({ id: tipId })
      .update({ price })
      .toString();
    return pool.one(_raw`${query}`);
  },
  getTip: async(id) => {
    const query = knex(table.tipInfo)
      .select()
      .where(`${table.tipInfo}.isDelete`, false)
      .where(`${table.tipInfo}.id`, id)
      .toString();
    const tips = await pool.one(_raw`${query}`);

    if (tips) {
      if (tips.visitorId) {
        tips.id = tips.visitorId;
      }
      if (tips.guestId) {
        tips.id = tips.guestId;
      }
    }
    return tips;
  },
  getAllCompleted: async(waiterId, dateStart, dateEnd) => {
    const query = knex(table.tipInfo)
      .select(
        `${table.tipInfo}.id as id`,
        `${table.tipInfo}.price as price`,
      )
      .where(`${table.tipInfo}.isDelete`, false)
      .where(`${table.tipInfo}.waiterId`, waiterId)
      .where(`${table.tipInfo}.transactionStatus`, statuses.COMPLETED)
      .where(`${table.tipInfo}.created_at`, '>=', dateStart)
      .where(`${table.tipInfo}.created_at`, '<=', dateEnd)
      .toString();
    let tips = await pool.many(_raw`${query}`);
    tips.forEach((item) => {
      if (item.price && typeof item.price === 'number' && item.price > 0) {
        item.price /= 100;
      }
    });
    return tips;
  },
};

function handlingListOfResults(tips) {
  const _tips = JSON.parse(JSON.stringify(tips));
  _tips.forEach((item) => {
    if (item.price && typeof item.price === 'number' && item.price > 0) {
      item.price /= 100;
    }
    if (item.waiterFirstName) {
      if (!item.waiter) item.waiter = {};
      item.waiter.firstName = item.waiterFirstName;
      item.waiterFirstName = null;
    }
    if (item.waiterLastName) {
      if (!item.waiter) item.waiter = {};
      item.waiter.lastName = item.waiterLastName;
      item.waiterLastName = null;
    }
    if (item.restaurantName) {
      if (!item.restaurant) item.restaurant = {};
      item.restaurant.name = item.restaurantName;
      item.restaurantName = null;
    }
    if (item.restaurantAddress) {
      if (!item.restaurant) item.restaurant = {};
      item.restaurant.address = item.restaurantAddress;
      item.restaurantAddress = null;
    }
    if (item.guestFirstName) {
      if (!item.guest) item.guest = {};
      item.guest.firstName = item.guestFirstName;
      item.guestFirstName = null;
    }
    if (item.guestLastName) {
      if (!item.guest) item.guest = {};
      item.guest.lastName = item.guestLastName;
      item.guestLastName = null;
    }
    if (item.visitorFirstName) {
      if (!item.visitor) item.visitor = {};
      item.visitor.firstName = item.visitorFirstName;
      item.visitorFirstName = null;
    }
    if (item.visitorLastName) {
      if (!item.visitor) item.visitor = {};
      item.visitor.lastName = item.visitorLastName;
      item.visitorLastName = null;
    }
    return item;
  });
  _tips.forEach((item) => {
    for (let value in item) {
      if (item[value] === '' || item[value] == null) {
        delete item[value];
      }
    }
  });
  return _tips;
}
