const yup = require('yup');

module.exports = yup.object().shape({
  firstName: yup.string()
    .required(),

  lastName: yup.string()
    .required(),
});
