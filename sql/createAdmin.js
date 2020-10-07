const {extend} = require('pg-extra');
const pg = extend(require('pg'));
const DATABASE_URL = require('../config').db.url;

const pool = new pg.Pool({connectionString: DATABASE_URL});
const {sql, _raw} = require('pg-extra');

const admin = '11111111-1111-1111-1111-111111111111';

const user = _raw`INSERT INTO "users" (id, email, password, "isDelete", type, "restoreToken", expires) VALUES
('${admin}', 'admin@asdf.com', '$2b$10$n460j6WkcpnoxAgXEsHhmOnoLkN8g7OoeC1NXZ5OATqNWIY8Nrm76', false, 'ADMIN', null, null)
;`;

function populateDb() {
  return pool.withTransaction(async(client) => {
    await client.query(user);
  });
}

async function createAdmin() {
  await populateDb();
  await pool.end();
  return 'Admin created';
}

populateDb()
  .then(res => console.log(res))
  .catch(err => console.error(err));


module.exports = () => createAdmin;
