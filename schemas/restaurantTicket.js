const yup = require('yup');

module.exports = yup.object().shape({
  name: yup.string()
    .required(),

  phone: yup.string()
    .required()
    .trim(),

  comment: yup.string(),
})
  .noUnknown();
