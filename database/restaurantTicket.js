const knex = require('knex')({ client: 'pg' });
const { pool, _raw } = require('./connection');

const table = {
  restaurantTicket: 'restaurantTicket',
};

module.exports = {
  regTicket: async (ticket) => {
    const query = knex(table.restaurantTicket)
      .insert(ticket)
      .toString();
    return pool.one(_raw`${query}`);
  },
};
