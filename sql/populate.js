const uuid = require('uuid');
const { pool, _raw, sql} = require('../database/connection');

const getUuid = () => uuid.v4();

// ////////////////////////////////////////

// instead null because null is not supported in column with type 'uuid'
const nullUuid = '00000000-0000-0000-0000-000000000000';
const admin = '11111111-1111-1111-1111-111111111111';
const userUuid1 = getUuid();
const userUuid2 = getUuid();
const userUuid3 = getUuid();
const userUuid4 = getUuid();
const userUuid5 = getUuid();
const userUuid6 = getUuid();

// decrypted password = '1q'
const user = _raw`INSERT INTO "users" (id, email, password, "isDelete", type, "restoreToken", expires) VALUES 
('${userUuid1}', '1@aaa.ru', '$2b$10$IZPS3weSWnuZ3TWARF9IQe0ziamF9BY1rkPzNRDcVVhfgn0RQpupq', false, 'RESTAURANT', null, null),
('${userUuid2}', '2@aaa.ru', '$2b$10$iN2ohSyd/OKbRdxUppBDauo8jczLsBWlY1h1H7T9ukkhB3atXiSKi', false, 'RESTAURANT', null, null),
('${userUuid3}', '3@aaa.ru', '$2b$10$sxGh64NU8WylhWJEMmBOf.YfDd7aiQfMbthyO3qNlXSxz7eHrOqxq', false, 'WAITER', null, null),
('${userUuid4}', '4@aaa.ru', '$2b$10$d3qAMIPjcbOLGgWHxRCcKu/IamkgetSVOIi5MaHp9eSrKnGBfld5K', false, 'WAITER', null, null),
('${userUuid5}', '5@aaa.ru', '$2b$10$LtQYfb5KyuW0pxoiRmLhtOf5vu4i3m7v1JdfU1A8sQM0EXO/TFJiq', false, 'VISITOR', null, null),
('${userUuid6}', '6@aaa.ru', '$2b$10$iKs1nrkQPD3u0THPMjvf5.NAHhTsWgRi6TUk7xCaOKYyftIwZRq7.', false, 'VISITOR', null, null),
('${nullUuid}', 'null', '$2b$10$ClJDzWd/JpJxlbFSa2TVpumgm83ACJVlvvPAG1gc7k0kxwYEzcXs.', false, 'NULL', null, null),
('${admin}', 'admin@asdf.com', '$2b$10$n460j6WkcpnoxAgXEsHhmOnoLkN8g7OoeC1NXZ5OATqNWIY8Nrm76', false, 'ADMIN', null, null)
;`;

const clearUser = sql`TRUNCATE TABLE "users" RESTART IDENTITY CASCADE;`;

// ////////////////////////////////////////

const reviewUuid1 = getUuid();
const reviewUuid2 = getUuid();

const review = _raw`INSERT INTO "review" (id, message, rating, "isDelete") VALUES
('${reviewUuid1}', 'test message 1', 4, false),
('${reviewUuid2}', 'test message 2', 5, false),
('${nullUuid}', null, null, true)
;`;

const clearReview = sql`TRUNCATE TABLE "review" RESTART IDENTITY CASCADE;`;

// ////////////////////////////////////////

const cardUuid1 = getUuid();
const cardUuid2 = getUuid();

const card = _raw`INSERT INTO "card" (id, "cardFirstSix", "cardLastFour", "cardExpDate", "cardType", "accountId", "recurringToken", "isDelete", "userId", "guestId") VALUES
('${cardUuid1}', '123456', '1234', '12/12', 'MasterCard', '1234', '123BBA133C182267FE5F086924ABDC5DB71F77BFC27F01F2843F2CDC69D89F05', false, '${userUuid3}', null),
('${cardUuid2}', '234567', '2345', '11/11', 'MasterCard', '2345', '234BBA133C182267FE5F086924ABDC5DB71F77BFC27F01F2843F2CDC69D89F05', false, '${userUuid4}', null)
;`;

const clearCard = sql`TRUNCATE TABLE "card" RESTART IDENTITY CASCADE;`;

// ////////////////////////////////////////

const restaurantUuid1 = getUuid();
const restaurantUuid2 = getUuid();

const restaurant = _raw`INSERT INTO "restaurant" (id, name, address, "userId", "isDelete") VALUES
('${restaurantUuid1}', 'restaurant 1', 'lenin st. 5, 1241234', '${userUuid1}', false),
('${restaurantUuid2}', 'restaurant 2', 'Pushkin st. 1, 1241234', '${userUuid2}', false)
;`;

const clearRestaurant = sql`TRUNCATE TABLE "restaurant" RESTART IDENTITY CASCADE;`;

// ////////////////////////////////////////

const waiterUuid1 = getUuid();
const waiterUuid2 = getUuid();

const waiter = _raw`INSERT INTO waiter (id, "firstName", "lastName", "userId", "cardInfo", "restaurantId", "isDelete") VALUES
('${waiterUuid1}', 'Ivan', 'Ivanov', '${userUuid3}', '${cardUuid1}', '${restaurantUuid1}', false),
('${waiterUuid2}', 'Petr', 'Petrov', '${userUuid4}', null, '${restaurantUuid2}', false)
;`;

const clearWaiter = sql`TRUNCATE TABLE "waiter" RESTART IDENTITY CASCADE;`;

// ////////////////////////////////////////

const visitorUuid1 = getUuid();
const visitorUuid2 = getUuid();

const visitor = _raw`INSERT INTO "visitor" (id, "firstName", "lastName", "cardInfo", "userId", "isDelete") VALUES
('${visitorUuid1}', 'Ivan', 'Ivanov', '${cardUuid2}', '${userUuid5}', false),
('${visitorUuid2}', 'Petr', 'Petrov', null, '${userUuid6}', false)
;`;

const clearVisitor = sql`TRUNCATE TABLE "visitor" RESTART IDENTITY CASCADE;`;

// ////////////////////////////////////////

const restaurantTicketUuid1 = getUuid();
const restaurantTicketUuid2 = getUuid();

const restaurantTicket = _raw`INSERT INTO "restaurantTicket" (id, name, phone, comment, "isDelete") VALUES
('${restaurantTicketUuid1}', 'ticket 1', '+7(999)123-12-12', 'test comment 1', false),
('${restaurantTicketUuid2}', 'ticket 2', '+7(888)123-12-12', 'test comment 2', false)
;`;

const clearRestaurantTicket = sql`TRUNCATE TABLE "restaurantTicket" RESTART IDENTITY CASCADE;`;

// ////////////////////////////////////////

const guestUuid1 = getUuid();
const guestUuid2 = getUuid();

const guest = _raw`INSERT INTO "guest" (id, "firstName", "lastName", "isDelete") VALUES
('${guestUuid1}', 'Vitaly', 'Kuznetsov', false),
('${guestUuid2}', 'Sergey', 'Shishkin', false),
('${nullUuid}', 'nullik', 'nullikov', false)
;`;

const clearGuest = sql`TRUNCATE TABLE "guest" RESTART IDENTITY CASCADE;`;

// ////////////////////////////////////////

const tipUuid1 = getUuid();
const tipUuid2 = getUuid();
const tipUuid3 = getUuid();

const tipInfo = _raw`INSERT INTO "tipInfo" (id, "waiterId", "visitorId", "guestId", "transactionStatus", "transactionInfo", "idTransaction", "reviewId", "isDelete", price) VALUES
('${tipUuid1}', '${userUuid3}', '${userUuid5}', null, 'COMPLETED', 'test1', '12345678', '${reviewUuid1}', false, '20000'),
('${tipUuid2}', '${userUuid4}', '${userUuid6}', null, 'COMPLETED', 'test2', '23456789', '${reviewUuid2}', false, '9900'),
('${tipUuid3}', '${userUuid4}', '${userUuid6}', null, 'COMPLETED', 'test2', '23456789', null, false, '99900')
;`;

const clearTipInfo = sql`TRUNCATE TABLE "tipInfo" RESTART IDENTITY CASCADE;`;

async function resetDb() {
  await clearDb();
  await populateDb();
  return 'Reset and paste sample data are successful!';
}

function populateDb() {
  return pool.withTransaction(async (client) => {
    await client.query(card);
    // console.log(user);
    await client.query(user);
    // console.log(review);
    await client.query(review);
    // console.log(restaurant);
    await client.query(restaurant);
    // console.log(waiter);
    await client.query(waiter);
    // console.log(visitor);
    await client.query(visitor);
    // console.log(restaurantTicket);
    await client.query(restaurantTicket);
    // console.log(guest);
    await client.query(guest);
    // console.log(tipInfo);
    await client.query(tipInfo);
  });
}

function clearDb() {
  return pool.withTransaction(async (client) => {
    // console.log(clearTipInfo);
    await client.query(clearTipInfo);
    // console.log(clearCard);
    await client.query(clearCard);
    // console.log(clearGuest);
    await client.query(clearGuest);
    // console.log(clearRestaurantTicket);
    await client.query(clearRestaurantTicket);
    // console.log(clearVisitor);
    await client.query(clearVisitor);
    // console.log(clearWaiter);
    await client.query(clearWaiter);
    // console.log(clearRestaurant);
    await client.query(clearRestaurant);
    // console.log(clearReview);
    await client.query(clearReview);
    // console.log(clearUser);
    await client.query(clearUser);
  });
}

// resetDb()
//   .then(res => console.log(res))
//   .catch(err => console.error(err));

module.exports = resetDb;
