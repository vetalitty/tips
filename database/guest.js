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
  guest: 'guest',
};

module.exports = {
  isUserExist: async (guest) => {
    const query = knex(table.guest)
      .where(`${table.guest}.isDelete`, false)
      .where(`${table.guest}.id`, guest)
      .select(
        `${table.guest}.firstName`,
        `${table.guest}.lastName`,
        `${table.guest}.id`,
      )
      .toString();
    const res = await pool.one(_raw`${query}`);
    if (res) return res;
  },
  register: async (guest) => {
    const query = knex(table.guest)
      .insert(guest)
      .toString();
    await pool.one(_raw`${query}`);
    return guest;
  },
  remove: (guest) => {
    const query = knex(table.guest)
      .where(`${table.guest}.id`, guest)
      .del()
      .toString();
    return pool.one(_raw`${query}`);
  },
  replaceGuestToVisitor: (guest, visitor) => {
    const query = knex(table.tipInfo)
      .update({
        visitorId: visitor,
        guestId: null,
      })
      .where(`${table.tipInfo}.guestId`, guest)
      .toString();
    return pool.one(_raw`${query}`);
  },
};
