const yup = require('yup');

module.exports = yup.object().shape({
  firstName: yup.string()
    .required()
    .trim(),

  lastName: yup.string()
    .required()
    .trim(),

  restaurantId: yup.string()
    .required()
    .trim(),
})
  .noUnknown();
