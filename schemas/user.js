const yup = require('yup');

module.exports = yup.object().shape({
  email: yup.string()
    .lowercase()
    .matches(/^[-\w.]+@([A-z0-9][-A-z0-9]+\.)+[A-z]{2,4}$/, 'incorrect email')
    .required()
    .trim(),

  password: yup.string()
    .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{2,}$/, 'incorrect password')
    .required(),
});
