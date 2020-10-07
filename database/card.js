const knex = require('knex')({ client: 'pg' });
const { pool, _raw } = require('./connection');
const table = require('./tables');

module.exports = {
  getCardInfo: (recurringToken) => {
    const query = knex(table.card)
      .select()
      .where(`${table.card}.isDelete`, false)
      .where(`${table.card}.recurringToken`, recurringToken)
      .toString();
    return pool.one(_raw`${query}`);
  },
  getCardInfoById: (id) => {
    const query = knex(table.card)
      .select()
      .where(`${table.card}.isDelete`, false)
      .where(`${table.card}.id`, id)
      .toString();
    return pool.one(_raw`${query}`);
  },
  getCardInfoForUser: async (userId, recurringToken) => {
    const query = knex(table.card)
      .select()
      .where(`${table.card}.isDelete`, false)
      .where(`${table.card}.userId`, userId)
      .where(`${table.card}.recurringToken`, recurringToken)
      .toString();
    return pool.one(_raw`${query}`);
  },
  saveCardData: async (data) => {
    const query = knex(table.card)
      .insert(data)
      .toString();
    return pool.one(_raw`${query}`);
  },
  setRecurringToken: (id, recurringToken) => {
    const query = knex(table.card)
      .where({ id })
      .update({ recurringToken })
      .toString();
    return pool.one(_raw`${query}`);
  },
  remove: async (id) => {
    const cquery = knex(table.card)
      .where({ id, isDelete: false })
      .count()
      .toString();
    const card = await pool.one(_raw`${cquery}`);
    if (card.count === 0) throw('card is not exist');
    const query = knex(table.card)
      .where({ id })
      .update({ isDelete: true })
      .toString();
    return pool.one(_raw`${query}`);
  },
  add: async (id) => {
    const query = knex(table.card)
      .where({ id })
      .update({ isDelete: true })
      .toString();
    return pool.one(_raw`${query}`);
  },
};
