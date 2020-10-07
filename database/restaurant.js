const knex = require('knex')({ client: 'pg' });
const { pool, _raw } = require('./connection');
const _ = require('lodash');

const table = {
  restaurant: 'restaurant',
  waiter: 'waiter',
  users: 'users',
  tipInfo: 'tipInfo',
  review: 'review',
};

module.exports = {
  register: async (restaurant) => {
    const query = knex(table.restaurant)
      .insert(restaurant)
      .toString();
    await pool.one(_raw`${query}`);
    return restaurant;
  },
  getRestaurantIdById: (id) => {
    const query = knex(table.restaurant)
      .where({ id })
      .toString();
    return pool.one(_raw`${query}`);
  },
  listWithAttachedCards: async (limit, offset) => {
    const query = `SELECT
      "restaurant"."userId" as "id",
      "restaurant"."name" as "name",
      "restaurant"."address" as "address",
      json_agg(
        (
          SELECT x FROM (
            SELECT 
            "waiter"."userId" as "id",
            "waiter"."firstName" as "firstName",
            "waiter"."lastName" as "lastName"
          ) AS x
        )
      ) as waiters
      FROM restaurant
      INNER JOIN waiter ON "restaurant"."id" = "waiter"."restaurantId"
      WHERE "restaurant"."isDelete" = false and
        "waiter"."isDelete" = false and
        "waiter"."cardInfo" IS NOT NULL
      GROUP BY "restaurant"."id"
      ORDER BY "restaurant"."name" asc
      OFFSET ${offset}
      LIMIT ${limit};`;
    return pool.many(_raw`${query}`);
  },
  getRestaurantIdByUserId: async (userId) => {
    const query = knex(table.restaurant)
      .where({ userId })
      .toString();
    return pool.one(_raw`${query}`);
  },
  getRestaurantIdByToken: async (token) => {
    const query = knex(table.restaurant)
      .where({ token })
      .toString();
    return pool.one(_raw`${query}`);
  },
  getAll: async (offset, limit) => {
    const query = knex(table.restaurant)
      .join(table.users, `${table.restaurant}.userId`, `${table.users}.id`)
      .select(`${table.restaurant}.name`, `${table.restaurant}.address`, `${table.restaurant}.userId as id`, `${table.users}.email`)
      .offset(offset)
      .limit(limit)
      .orderBy('name')
      .where(`${table.restaurant}.isDelete`, false)
      .toString();
    return pool.many(_raw`${query}`);
  },
  update: async (data) => {
    let mainQuery = '';
    if (!_.isEmpty(data.restaurant)) {
      const query = knex(table.restaurant)
        .where(`${table.restaurant}.userId`, data.userId)
        .update(data.restaurant)
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
    // delete restaurant (include table users) and also linked waiters (include table users)
    const queryRestaurant = knex(table.restaurant)
      .where({ userId: id, isDelete: false })
      .toString();
    const restaurant = await pool.one(_raw`${queryRestaurant}`);

    const queryWaiters = knex(table.waiter)
      .where({ restaurantId: restaurant.id, isDelete: false })
      .toString();
    const waiters = await pool.many(_raw`${queryWaiters}`);

    let del = '';

    const delRestaurant = knex(table.restaurant)
      .where({ id: restaurant.id })
      .update({ isDelete: true })
      .toString();
    del += `${delRestaurant};\n`;

    const delRestaurantUser = knex(table.users)
      .where({ id: restaurant.userId })
      .update({ isDelete: true })
      .toString();
    del += `${delRestaurantUser};\n`;

    for (let i = 0; i < waiters.length; i++) {
      const delWaiter = knex(table.waiter)
        .where({ id: waiters[i].id })
        .update({ isDelete: true })
        .toString();
      const delWaiterUser = knex(table.users)
        .where({ id: waiters[i].userId })
        .update({ isDelete: true })
        .toString();
      del += `${delWaiter};\n`;
      del += `${delWaiterUser};\n`;
    }
    del = _raw`${del}`;
    return pool.withTransaction(async (client) => {
      await client.query(del);
    });
  },
  getInfo: async (id) => {
    const queryRestaurant = knex(table.restaurant)
      .join(table.users, `${table.restaurant}.userId`, `${table.users}.id`)
      .select(
        `${table.users}.id`,
        `${table.users}.email`,
        `${table.restaurant}.name`,
        `${table.restaurant}.address`,
      )
      .where(`${table.restaurant}.userId`, id)
      .toString();
    return pool.one(_raw`${queryRestaurant}`);
  },
  getRating: async (id, dateStart, dateEnd) => {
    const query = knex(table.review)
      .join(table.tipInfo, `${table.tipInfo}.reviewId`, `${table.review}.id`)
      .join(table.waiter, `${table.waiter}.userId`, `${table.tipInfo}.waiterId`)
      .join(table.restaurant, `${table.restaurant}.id`, `${table.waiter}.restaurantId`)
      .where(`${table.tipInfo}.isDelete`, false)
      .where(`${table.review}.isDelete`, false)
      .where(`${table.waiter}.isDelete`, false)
      .where(`${table.restaurant}.isDelete`, false)
      .where(`${table.tipInfo}.created_at`, '>=', dateStart)
      .where(`${table.tipInfo}.created_at`, '<=', dateEnd)
      .where(`${table.restaurant}.userId`, id)
      .avg(`${table.review}.rating`)
      .toString();
    const res = await pool.one(_raw`${query}`);
    return res.avg;
  },
  getRatingRestaurantWaiter: async (id, dateStart, dateEnd) => {
    const query = knex(table.review)
      .join(table.tipInfo, `${table.tipInfo}.reviewId`, `${table.review}.id`)
      .join(table.waiter, `${table.waiter}.userId`, `${table.tipInfo}.waiterId`)
      .join(table.restaurant, `${table.restaurant}.id`, `${table.waiter}.restaurantId`)
      .where(`${table.tipInfo}.isDelete`, false)
      .where(`${table.review}.isDelete`, false)
      .where(`${table.waiter}.isDelete`, false)
      .where(`${table.restaurant}.isDelete`, false)
      .where(`${table.tipInfo}.waiterId`, id)
      .where(`${table.tipInfo}.created_at`, '>=', dateStart)
      .where(`${table.tipInfo}.created_at`, '<=', dateEnd)
      .avg(`${table.review}.rating`)
      .toString();
    const res = await pool.one(_raw`${query}`);
    return res.avg;
  },
  isUserExist: async (userId) => {
    const query = knex(table.restaurant)
      .join(table.users, `${table.restaurant}.userId`, `${table.users}.id`)
      .where(`${table.restaurant}.isDelete`, false)
      .where(`${table.restaurant}.userId`, userId)
      .count()
      .toString();
    const res = await pool.one(_raw`${query}`);
    if (res.count !== 0) return true;
  },

};
