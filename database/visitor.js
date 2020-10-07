const knex = require('knex')({ client: 'pg' });
const { pool, _raw } = require('./connection');
const _ = require('lodash');

const table = {
  visitor: 'visitor',
  users: 'users',
  review: 'review',
  tipInfo: 'tipInfo',
  waiter: 'waiter',
  restaurant: 'restaurant',
};

module.exports = {
  isUserExist: async (userId) => {
    const query = knex(table.visitor)
      .join(table.users, `${table.visitor}.userId`, `${table.users}.id`)
      .where(`${table.visitor}.isDelete`, false)
      .where(`${table.visitor}.userId`, userId)
      .count()
      .toString();
    const res = await pool.one(_raw`${query}`);
    if (res.count !== 0) return true;
  },
  register: async (visitor) => {
    const query = knex(table.visitor)
      .insert(visitor)
      .toString();
    await pool.one(_raw`${query}`);
    return visitor;
  },
  getList: async (offset, limit) => {
    const query = knex(table.visitor)
      .join(table.users, `${table.visitor}.userId`, `${table.users}.id`)
      .select(
        `${table.users}.id`,
        `${table.users}.email`,
        `${table.users}.type`,
        `${table.visitor}.firstName`,
        `${table.visitor}.lastName`,
      )
      .offset(offset)
      .limit(limit)
      .orderBy(`${table.visitor}.firstName`)
      .where(`${table.visitor}.isDelete`, false)
      .toString();
    return pool.many(_raw`${query}`);
  },
  del: async (id) => {
    const queryVisitor = knex(table.visitor)
      .where({ userId: id })
      .update({ isDelete: true })
      .toString();
    const sqlVisitor = _raw`${queryVisitor}`;

    const queryUser = knex(table.users)
      .where({ id })
      .update({ isDelete: true })
      .toString();
    const sqlUsers = _raw`${queryUser}`;

    return pool.withTransaction(async (client) => {
      await client.query(sqlVisitor);
      await client.query(sqlUsers);
    });
  },
  update: async (data) => {
    let mainQuery = '';
    if (!_.isEmpty(data.visitor)) {
      const query = knex(table.visitor)
        .where(`${table.visitor}.userId`, data.userId)
        .update(data.visitor)
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
  getInfo: async (id) => {
    const queryVisitor = knex(table.visitor)
      .join(table.users, `${table.visitor}.userId`, `${table.users}.id`)
      .select(
        `${table.users}.id`,
        `${table.users}.email`,
        `${table.visitor}.firstName`,
        `${table.visitor}.lastName`,
      )
      .where(`${table.visitor}.userId`, id)
      .toString();
    return pool.one(_raw`${queryVisitor}`);
  },
  getRating: async (id, dateStart, dateEnd) => {
    const query = knex(table.review)
      .join(table.tipInfo, `${table.tipInfo}.reviewId`, `${table.review}.id`)
      .join(table.waiter, `${table.waiter}.userId`, `${table.tipInfo}.waiterId`)
      .join(table.restaurant, `${table.restaurant}.id`, `${table.waiter}.restaurantId`)
      .where(`${table.tipInfo}.isDelete`, false)
      .andWhere(`${table.review}.isDelete`, false)
      .andWhere(`${table.waiter}.isDelete`, false)
      .andWhere(`${table.restaurant}.isDelete`, false)
      .andWhere(`${table.tipInfo}.created_at`, '>=', dateStart)
      .andWhere(`${table.tipInfo}.created_at`, '<=', dateEnd)
      .where(`${table.tipInfo}.visitorId`, id)
      .avg(`${table.review}.rating`)
      .toString();
    const res = await pool.one(_raw`${query}`);
    return res.avg;
  },
  setCardInfo: async (cardInfo, visitorId) => {
    const query = knex(table.visitor)
      .where(`${table.visitor}.userId`, visitorId)
      .update(cardInfo)
      .toString();
    return pool.one(_raw`${query}`);
  },
};
