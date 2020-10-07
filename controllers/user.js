const uuid = require('uuid');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const isUUID = require('is-uuid').v4;
const validator = require('validator');
const Email = require('../lib/email');
const ERROR_CODE = require('../lib/constants').ERROR_CODE;

const { ValidationError } = require('../lib/errors');
const { UnauthorizedError } = require('../lib/errors');
const { generateJWT } = require('../lib/utils');
const db = require('../database');
const visitorController = require('./visitor');
const waiterController = require('./waiter');
const restaurantController = require('./restaurant');
const config = require('../config');
const service = require('../service');

module.exports = {
  async registerVisitor(ctx) {
    const { body } = ctx.request;

    // validate input fields for user and visitor
    await ctx.app.schemas.user.validate(body);
    await ctx.app.schemas.visitor.validate(body);

    // register part user
    let { user } = await service.user.register.systemPart(ctx, body, 'VISITOR');

    // register part visitor
    const visitor = {};
    visitor.id = uuid.v4();
    visitor.firstName = body.firstName;
    visitor.lastName = body.lastName;
    visitor.cardInfo = null;
    visitor.userId = user.id;
    await visitorController.register(ctx, visitor);

    user = generateJWT(user);

    ctx.body = { user: _.omit(user, ['password']), message: 'success' };

    // return ctx.body = { code: 0 };
  },

  async registerGuestAsVisitor(ctx) {
    const { body } = ctx.request;
    const _guest = ctx.request.headers.guest;
    await ctx.app.schemas.user.validate(body);

    // register part user
    const salt = await bcrypt.genSalt(10);
    let user = {};
    user.id = uuid.v4();
    user.email = body.email.toLowerCase();
    const isUserExist = await db.user.getUserByEmail(user.email);
    if (isUserExist) {
      return ctx.throw(422, new ValidationError(['user'], '', ERROR_CODE.ALREADY_EXIST));
    }
    if (!validator.isUUID(_guest.toString())) ctx.throw(422, new ValidationError(['guest'], '', ERROR_CODE.INCORRECT_DATA));
    const guest = await db.guest.isUserExist(_guest);
    if (!guest) {
      return ctx.throw(422, new ValidationError(['guest'], '', ERROR_CODE.NOT_EXIST));
    }
    let firstName;
    let lastName;
    if (body.firstName && body.lastName) {
      await ctx.app.schemas.guest.validate(body);
      firstName = body.firstName;
      lastName = body.lastName;
    } else {
      firstName = guest.firstName;
      lastName = guest.lastName;
    }
    user.password = await bcrypt.hash(body.password, salt);
    user.type = 'VISITOR';
    await db.user.register(user);

    // register part visitor
    const visitor = {};
    visitor.id = uuid.v4();
    visitor.firstName = firstName;
    visitor.lastName = lastName;
    visitor.cardInfo = null;
    visitor.userId = user.id;
    await visitorController.register(ctx, visitor);
    await db.guest.replaceGuestToVisitor(guest.id, user.id);
    await db.guest.remove(guest.id);

    user = generateJWT(user);

    ctx.body = { user: _.omit(user, ['password']), message: 'success' };
  },

  async registerRestaurant(ctx) {
    const { body } = ctx.request;

    // validate input fields for user and restaurant
    await ctx.app.schemas.user.validate(body);
    await ctx.app.schemas.restaurant.validate(body);

    // register part user
    let { user } = await service.user.register.systemPart(ctx, body, 'RESTAURANT');

    // register part restaurant
    const restaurant = {};
    restaurant.id = uuid.v4();
    restaurant.name = body.name;
    restaurant.address = body.address;
    restaurant.userId = user.id;
    await restaurantController.register(ctx, restaurant);

    user = generateJWT(user);

    ctx.body = { user: _.omit(user, ['password']), message: 'success' };
  },

  async registerWaiter(ctx) {
    const { body } = ctx.request;

    // validate input fields for user and restaurant
    await ctx.app.schemas.user.validate(body);
    await ctx.app.schemas.waiter.validate(body);
    const restaurantId = body.restaurantId;
    if (!isUUID(restaurantId)) {
      ctx.throw(422, new ValidationError(['restaurantId'], '', ERROR_CODE.INCORRECT_DATA));
    }
    const isRestaurantIdValid = await db.restaurant.getRestaurantIdById(restaurantId);
    if (!isRestaurantIdValid) {
      ctx.throw(422, new ValidationError(['restaurantId'], '', ERROR_CODE.NOT_EXIST));
    }

    // register part user
    let { user } = await service.user.register.systemPart(ctx, body, 'WAITER');

    // register part waiter
    const waiter = {};
    waiter.id = uuid.v4();
    waiter.firstName = body.firstName;
    waiter.lastName = body.lastName;
    waiter.userId = user.id;
    waiter.restaurantId = restaurantId;
    await waiterController.register(ctx, waiter);

    user = generateJWT(user);

    ctx.body = { user: _.omit(user, ['password']), message: 'success' };
  },

  async login(ctx) {
    let body = ctx.request.body || {};

    body = await ctx.app.schemas.user.validate(body);

    const user = {};
    user.email = body.email.toLowerCase();
    user.password = body.password;

    let dbuser = await db.user.getUserByEmail(user.email);
    if (!dbuser) {
      ctx.throw(422, new ValidationError(['user'], '', ERROR_CODE.NOT_EXIST));
    }

    const isValid = await bcrypt.compare(body.password, dbuser.password);
    if (!isValid) {
      ctx.throw(422, new ValidationError(['email or password'], '', ERROR_CODE.INCORRECT_LOGIN_DATA));
    }

    dbuser = generateJWT(dbuser);

    ctx.body = { user: _.omit(dbuser, ['password', 'restoreToken', 'expires', 'created_at', 'updated_at']) };
  },
  async forgotPassword(ctx) {
    let { email } = ctx.request.body;

    if (typeof (email) !== 'string' || !validator.isEmail(email)) {
      ctx.throw(422, new ValidationError(['is invalid'], '', ERROR_CODE.INCORRECT_LOGIN_DATA));
    }

    email = email.toLowerCase();
    const user = await db.user.getUserByEmail(email);
    if (!user) {
      ctx.throw(422, new ValidationError(['user'], '', ERROR_CODE.NOT_EXIST));
    }
    if (user.type === 'ADMIN') {
      ctx.throw(404, new ValidationError(['not allowed for admin'], '', ERROR_CODE.ACCESS_DENIED));
    }

    const { restoreToken } = await db.user.setExpireToken(email);

    const restoreLink = `https://${config.front.domain}/restore?token=${restoreToken}`;
    const mail = new Email();
    mail.addUsers([email]);
    mail.addSubject(['Restore password']);
    mail.addMessages([`<b>To restore your password - tap the <a href="${restoreLink}">link<a><b>`]);
    await mail.send();


    ctx.body = { message: 'success' };
  },
  async changePassword(ctx) {
    const { token, newPassword } = ctx.request.body;

    if (typeof (newPassword) !== 'string' || typeof (token) !== 'string') {
      ctx.throw(422, new ValidationError(['new password or token'], '', ERROR_CODE.INCORRECT_DATA));
    }
    let user;
    try {
      user = await db.user.checkRestoreToken(token);
    } catch (e) {
      ctx.throw(422, new ValidationError(['token'], '', ERROR_CODE.INCORRECT_DATA));
    }

    if (!newPassword.match(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{2,}$/)) {
      ctx.throw(422, new ValidationError(['new password'], '', ERROR_CODE.INCORRECT_DATA));
    }
    const salt = await bcrypt.genSalt(10);
    const hashNewPassword = await bcrypt.hash(newPassword, salt);

    await db.user.changePassword({ password: hashNewPassword, email: user.email });
    await db.user.cleanExpireToken(user.email);
    ctx.body = { message: 'success' };
  },
  async info(ctx) {
    const guest = ctx.request.headers.guest;
    if (guest) {
      if (!validator.isUUID(guest.toString())) ctx.throw(422, new ValidationError(['guest'], '', ERROR_CODE.INCORRECT_DATA));
      const guestInfo = await db.guest.isUserExist(guest);
      if (!guestInfo) ctx.throw(422, new ValidationError(['guest'], '', ERROR_CODE.INCORRECT_DATA));
      guestInfo.isGuest = true;
      return ctx.body = { info: guestInfo };
    }
    if (!ctx.state.user) ctx.throw(401, new UnauthorizedError());
    const type = ctx.state.user.type;
    let user;
    let cards;
    switch (type) {
      case 'ADMIN':
        const fullAdminInfo = await db.user.getUserByEmail(ctx.state.user.email);
        user = { id: fullAdminInfo.id, email: fullAdminInfo.email };
        if (user) user.type = 'ADMIN';
        break;
      case 'RESTAURANT':
        user = await db.restaurant.getInfo(ctx.state.user.id);
        if (user) user.type = 'RESTAURANT';
        break;
      case 'VISITOR':
        user = await db.visitor.getInfo(ctx.state.user.id);
        if (user) user.type = 'VISITOR';
        try {
          cards = await db.tips.getAllCardsUser(user.id);
        } catch (e) {
        }
        break;
      case 'WAITER':
        user = await db.waiter.getInfo(ctx.state.user.id);
        if (user) user.type = 'WAITER';
        try {
          cards = await db.tips.getAllCardsUser(user.id);
        } catch (e) {
        }
        break;
      default:
        ctx.throw(404, new ValidationError([], '', ERROR_CODE.ACCESS_DENIED));
    }
    ctx.body = { info: user };
    if (cards) ctx.body.cards = cards;
  },
};
