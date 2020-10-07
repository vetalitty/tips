const ERROR_CODE = require('../lib/constants').ERROR_CODE;
const db = require('../database');
const { ValidationError } = require('../lib/errors');
const bcrypt = require('bcrypt');
const uuid = require('uuid');

module.exports = {
  register: {
    async systemPart(ctx, body, type) {
      const salt = await bcrypt.genSalt(10);
      let user = {};
      user.id = uuid.v4();
      user.email = body.email.toLowerCase();
      const isUserExist = await db.user.getUserByEmail(user.email);
      if (isUserExist) {
        return ctx.throw(422, new ValidationError(['user'], '', ERROR_CODE.ALREADY_EXIST));
      }
      user.password = await bcrypt.hash(body.password, salt);
      user.type = type;
      await db.user.register(user);
      return { user };
    }
  }
};
