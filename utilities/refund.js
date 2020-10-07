const knex = require('knex')({ client: 'pg' });
const request = require('request-promise-any');
const { pool, _raw } = require('../database/connection');
const { statuses } = require('../lib/paymentStatus');
const config = require('../config');

start()
  .then(res => console.log(`success`))
  .catch(err => console.error(err));

async function start() {
  const tips = await getTips();
  for (let i = 0; i < tips.length; i++) {
    await refund(tips[i]);
  }
}

function getTips() {
  const query = knex('tipInfo')
    .where({ transactionStatus: statuses.ADD_CARD_FLOW_REFUND_PROCESSING })
    .toString();
  return pool.many(_raw`${query}`);
}

function setPaymentStatus(status, tipId) {
  const query = knex('tipInfo')
    .where({ id: tipId })
    .update({ transactionStatus: status })
    .toString();
  return pool.one(_raw`${query}`);
}

async function refund(tip) {
  const transactionId = parseInt(tip.idTransaction);
  const options = {
    method: 'post',
    uri: config.payment.refundUrl,
    headers: {},
    body: {
      TransactionId: transactionId,
      Amount: config.payment.refundAmount,
    },
    auth: {
      user: config.payment.auth.publicId,
      pass: config.payment.auth.apiSecret,
    },
    json: true,
  };
  const cloudPaymentsResponse = await request(options);
  if (cloudPaymentsResponse.Success) {
    await setPaymentStatus(statuses.REFUNDED, tip.id);
  } else {
    throw(`Refund error. CP message: ${cloudPaymentsResponse.Message || cloudPaymentsResponse.Model.CardHolderMessage}`);
  }
}
