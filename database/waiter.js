const knex = require('knex')({ client: 'pg' });
const { pool, _raw } = require('./connection');
const _ = require('lodash');

const table = {
  waiter: 'waiter',
  users: 'users',
  restaurant: 'restaurant',
  tipInfo: 'tipInfo',
  review: 'review',
};

module.exports = {
  register: async (waiter) => {
    const query = knex(table.waiter)
      .insert(waiter)
      .toString();
    await pool.one(_raw`${query}`);
    return waiter;
  },
  getAll: async (offset, limit) => {
    const query = knex(table.waiter)
      .join(table.users, `${table.waiter}.userId`, `${table.users}.id`)
      .join(table.restaurant, `${table.waiter}.restaurantId`, `${table.restaurant}.id`)
      .select(
        `${table.waiter}.userId as waiterId`,
        `${table.waiter}.firstName`,
        `${table.waiter}.lastName`,
        `${table.users}.email`,
        `${table.waiter}.cardInfo`,
        `${table.restaurant}.userId as restaurantId`,
        `${table.restaurant}.name as restaurantName`,
        `${table.restaurant}.address as restaurantAddress`,
      )
      .offset(offset)
      .limit(limit)
      .orderBy(`${table.waiter}.firstName`)
      .where(`${table.waiter}.isDelete`, false)
      .toString();
    let queryRes = await pool.many(_raw`${query}`);
    queryRes = queryRes.map(item => ({
      id: item.waiterId,
      firstName: item.firstName,
      lastName: item.lastName,
      email: item.email,
      cardInfo: item.cardInfo,
      restaurant: {
        id: item.restaurantId,
        restaurantName: item.restaurantName,
        restaurantAddress: item.restaurantAddress,
      },
    }));
    return queryRes;
  },
  listWaitersForRestaurant: async (id, offset, limit) => {
    const query = knex(table.waiter)
      .join(table.users, `${table.waiter}.userId`, `${table.users}.id`)
      .join(table.restaurant, `${table.waiter}.restaurantId`, `${table.restaurant}.id`)
      .select(
        `${table.waiter}.firstName`,
        `${table.waiter}.lastName`,
        `${table.waiter}.userId as id`,
        `${table.users}.email`,
        `${table.waiter}.cardInfo`,
      )
      .offset(offset)
      .limit(limit)
      .orderBy(`${table.waiter}.firstName`)
      .where(`${table.waiter}.isDelete`, false)
      .where(`${table.restaurant}.userId`, id)
      .toString();
    return pool.many(_raw`${query}`);
  },
  update: async (data) => {
    let mainQuery = '';
    if (!_.isEmpty(data.waiter)) {
      const query = knex(table.waiter)
        .where(`${table.waiter}.userId`, data.userId)
        .update(data.waiter)
        .toString();
      mainQuery += `${query};\n`;
    }

    if (!_.isEmpty(data.users)) {
      const query = knex(table.users)
        .where(`${table.users}.id`, data.userId)
        .update(data.users)
        .toString();
      mainQuery += `${query};\n`;
    }
    if (!mainQuery) return;
    mainQuery = _raw`${mainQuery}`;

    return pool.withTransaction(client => client.query(mainQuery));
  },
  del: async (id) => {
    const queryWaiter = knex(table.waiter)
      .where({ userId: id })
      .update({ isDelete: true })
      .toString();
    const sqlWaiter = _raw`${queryWaiter}`;

    const queryUser = knex(table.users)
      .where({ id })
      .update({ isDelete: true })
      .toString();
    const sqlUsers = _raw`${queryUser}`;

    return pool.withTransaction(async (client) => {
      await client.query(sqlWaiter);
      await client.query(sqlUsers);
    });
  },
  getInfo: async (id) => {
    const queryWaiter = knex(table.waiter)
      .join(table.users, `${table.waiter}.userId`, `${table.users}.id`)
      .join(table.restaurant, `${table.waiter}.restaurantId`, `${table.restaurant}.id`)
      .select(
        `${table.users}.email`,
        `${table.waiter}.firstName`,
        `${table.waiter}.lastName`,
        `${table.waiter}.cardInfo`,
        `${table.waiter}.userId as waiterId`,
        `${table.restaurant}.name as restaurantName`,
        `${table.restaurant}.userId as restaurantId`,
        `${table.restaurant}.address as restaurantAddress`,
      )
      .where(`${table.waiter}.userId`, id)
      .toString();
    const waiterInfo = await pool.one(_raw`${queryWaiter}`);
    return {
      id: waiterInfo.waiterId,
      email: waiterInfo.email,
      firstName: waiterInfo.firstName,
      lastName: waiterInfo.lastName,
      cardInfo: waiterInfo.cardInfo,
      restaurant: {
        id: waiterInfo.restaurantId,
        name: waiterInfo.restaurantName,
        address: waiterInfo.restaurantAddress,
      },
    };
  },
  getRating: async (id, dateStart, dateEnd) => {
    const query = knex(table.review)
      .join(table.tipInfo, `${table.tipInfo}.reviewId`, `${table.review}.id`)
      .join(table.waiter, `${table.waiter}.userId`, `${table.tipInfo}.waiterId`)
      .where(`${table.tipInfo}.isDelete`, false)
      .andWhere(`${table.review}.isDelete`, false)
      .andWhere(`${table.waiter}.isDelete`, false)
      .andWhere(`${table.tipInfo}.waiterId`, id)
      .andWhere(`${table.tipInfo}.created_at`, '>=', dateStart)
      .andWhere(`${table.tipInfo}.created_at`, '<=', dateEnd)
      .avg(`${table.review}.rating`)
      .toString();
    const res = await pool.one(_raw`${query}`);
    return res.avg;
  },
  isUserExist: async (userId) => {
    const query = knex(table.waiter)
      .join(table.users, `${table.waiter}.userId`, `${table.users}.id`)
      .where(`${table.waiter}.isDelete`, false)
      .where(`${table.waiter}.userId`, userId)
      .count()
      .toString();
    const res = await pool.one(_raw`${query}`);
    if (res.count !== 0) return true;
  },
  setCardInfo: async (cardInfo, waiterId) => {
    const query = knex(table.waiter)
      .where(`${table.waiter}.userId`, waiterId)
      .update(cardInfo)
      .toString();
    return pool.one(_raw`${query}`);
  },
};
