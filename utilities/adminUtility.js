const bcrypt = require('bcrypt');
const argv = require('minimist')(process.argv.slice(2));

const knex = require('knex')({ client: 'pg' });
const { pool, _raw } = require('../database/connection');

start()
  .then(res => console.log(`Successfully changed:\nuser: ${argv.email}\npassword: ${argv.password}`))
  .catch(err => console.error(err));

async function start() {
  validate();
  const hash = await generateHash(argv.password.toString());
  const data = { password: hash, email: argv.email.toString() };
  await updateCredentials(data);
}

async function generateHash(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

async function updateCredentials(data) {
  const query = knex('users')
    .where({ email: data.email, type: 'ADMIN' })
    .update({ email: data.email, password: data.password })
    .toString();

  const queryUser = knex('users')
    .where({ email: data.email, type: 'ADMIN' })
    .toString();

  const user = await pool.one(_raw`${queryUser}`);
  if (!user) {
    throw new Error('user is not exist');
  }
  await pool.one(_raw`${query}`);
}

function validate() {
  if (!argv.email || !argv.password) {
    throw new Error('missing password or email');
  }
}
