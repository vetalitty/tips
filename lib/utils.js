const jwt = require('jsonwebtoken');
const _ = require('lodash');
const { jwtSecret, jwtOptions } = require('../config');
const { ValidationError } = require('../lib/errors');
const ERROR_CODE = require('../lib/constants').ERROR_CODE;
const validator = require('validator');

function generateJWT(user = {}) {
  return Object.assign({}, user, {
    token: jwt.sign({
      sub: _.pick(user, ['id', 'email', 'username', 'type']),
    }, jwtSecret, jwtOptions),
  });
}

function handleDateParams(ctx) {
  // const validateDate = /(19|20)\d\d-((0[1-9]|1[012])-(0[1-9]|[12]\d)|(0[13-9]|1[012])-30|(0[13578]|1[02])-31)T(([0-1]\d|2[0-3])(:[0-5]\d){2}Z$)/;
  let { dateStart, dateEnd } = ctx.query;
  if (dateStart || dateEnd) {
    if (typeof (dateStart) !== 'string' || typeof (dateEnd) !== 'string') {
      ctx.throw(422, new ValidationError([], '', ERROR_CODE.INCORRECT_DATE_RANGE));
    }
    if (!validator.isISO8601(dateStart)) {
      ctx.throw(422, new ValidationError(['dateStart'], '', ERROR_CODE.INCORRECT_DATE_RANGE));
    }
    if (!validator.isISO8601(dateEnd)) {
      ctx.throw(422, new ValidationError(['dateEnd'], '', ERROR_CODE.INCORRECT_DATE_RANGE));
    }
  } else {
    dateStart = '2000-01-01 00:00:00';
    dateEnd = '2050-01-01 00:00:00';
  }
  return { dateStart, dateEnd };
}

function handleDateParamsStrictly(dateStart, dateEnd) {
  // const validateDate = /(19|20)\d\d-((0[1-9]|1[012])-(0[1-9]|[12]\d)|(0[13-9]|1[012])-30|(0[13578]|1[02])-31)T(([0-1]\d|2[0-3])(:[0-5]\d){2}Z$)/;
  if (!dateStart || !dateEnd) {
    throw new Error('Incorrect dateStart, dateEnd');
  }
  if (typeof (dateStart) !== 'string' || typeof (dateEnd) !== 'string') {
    throw new Error(ERROR_CODE.INCORRECT_DATE_RANGE);
  }
  if (!validator.isISO8601(dateStart)) {
    throw new Error(ERROR_CODE.INCORRECT_DATE_RANGE);
  }
  if (!validator.isISO8601(dateEnd)) {
    throw new Error(ERROR_CODE.INCORRECT_DATE_RANGE);
  }

  return { dateStart, dateEnd };
}

module.exports.generateJWT = generateJWT;
module.exports.handleDateParams = handleDateParams;
module.exports.handleDateParamsStrictly = handleDateParamsStrictly;
