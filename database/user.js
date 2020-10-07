const knex = require('knex')({ client: 'pg' });
const { pool, _raw } = require('./connection');
const uuid = require('uuid');

const table = {
  users: 'users',
  restaurant: 'restaurant',
  visitor: 'visitor',
  waiter: 'waiter',
};

module.exports = {
  getUserByEmail: async (email) => {
    const query = knex(table.users)
      .where({ email })
      .toString();
    return pool.one(_raw`${query}`);
  },
  register: async (user) => {
    const query = knex(table.users)
      .insert(user)
      .toString();
    await pool.one(_raw`${query}`);
    return user;
  },
  changePassword: async (user) => {
    const query = knex(table.users)
      .update({ password: user.password })
      .where({ email: user.email })
      .toString();
    return pool.one(_raw`${query}`);
  },
  setExpireToken: async (email) => {
    const today = new Date();
    const dateExpire = new Date(today.setHours(today.getMinutes() + 1));
    const data = { restoreToken: uuid.v4(), expires: dateExpire };
    const query = knex(table.users)
      .update(data)
      .where({ email })
      .toString();
    await pool.one(_raw`${query}`);
    return data;
  },
  checkRestoreToken: async (restoreToken) => {
    const query = knex(table.users)
      .where({ restoreToken })
      .toString();
    const user = await pool.one(_raw`${query}`);
    if (!user || !user.restoreToken || !user.expires) {
      throw new Error('Invalid restore token');
    }
    const diff = Math.abs(user.expires.getTime() - new Date());
    if (diff < 0) {
      throw new Error('Token is expire');
    }
    return user;
  },
  cleanExpireToken: async (email) => {
    const query = knex(table.users)
      .update({ restoreToken: null, expires: null })
      .where({ email })
      .toString();
    return pool.one(_raw`${query}`);
  },
};
