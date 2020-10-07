// const uuid = require('uuid');
const _ = require('lodash');
const { ValidationError } = require('../lib/errors');
const db = require('../database');
const isUUID = require('is-uuid').v4;
const ERROR_CODE = require('../lib/constants').ERROR_CODE;

module.exports = {
  async register(ctx, visitorData) {
    await ctx.app.schemas.visitor.validate(visitorData);
    await db.visitor.register(visitorData);
  },
  async get(ctx) {
    const { offset, limit } = ctx.query;
    const visitors = await db.visitor.getList(offset, limit);
    ctx.body = { visitors };
  },
  async update(ctx) {
    const { body } = ctx.request;
    checkInput(body, ctx);

    const isUserExist = await db.visitor.isUserExist(body.userId);
    if (!isUserExist) {
      ctx.throw(422, new ValidationError(['user'], '', ERROR_CODE.NOT_EXIST));
    }

    const data = {};
    data.userId = body.userId;
    data.visitor = {};
    data.users = {};
    if (body.firstName) data.visitor.firstName = body.firstName;
    if (body.lastName) data.visitor.lastName = body.lastName;
    if (body.email) data.users.email = body.email;

    await db.visitor.update(data);
    ctx.body = { message: 'success' };
  },
  async del(ctx) {
    const id = ctx.params.id;
    checkInput({ userId: id }, ctx);
    const isUserExist = await db.visitor.isUserExist(id);
    if (!isUserExist) {
      ctx.throw(422, new ValidationError(['user'], '', ERROR_CODE.NOT_EXIST));
    }
    await db.visitor.del(id);
    ctx.body = { message: 'success' };
  },
};

function checkInput(params, ctx) {
  if (!params.userId) ctx.throw(422, new ValidationError(['userId'], '', ERROR_CODE.INCORRECT_DATA));
  if (!isUUID(params.userId)) ctx.throw(422, new ValidationError(['userId'], '', ERROR_CODE.INCORRECT_DATA));
}
