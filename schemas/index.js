const restaurantTicket = require('./restaurantTicket');
const user = require('./user');
const visitor = require('./visitor');
const restaurant = require('./restaurant');
const waiter = require('./waiter');
const guest = require('./guest');

module.exports = function (app) {
  app.schemas = {
    restaurantTicket,
    user,
    visitor,
    restaurant,
    waiter,
    guest,
  };
};
