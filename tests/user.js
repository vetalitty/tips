

const chai = require('chai');

const expect = chai.expect;
const request = require('request-promise-any');
const baseUrl = 'http://localhost:3001/api';
const resetDB = require('../sql/populate');
const getUuid = require('uuid').v4;
// const server = require('../bin/server');

describe('Tests', function () {
  this.timeout(5000);
  const token = {};
  let restaurantId;
  let idDelRestaurant;
  let idDelVisitor;
  let idDelWaiter;
  const populateData = {};
  let forReview;
  let guestId;

  before(async () => {
    try { await resetDB();} catch (e) {
      console.log('errr',e)
    }
    await pause();
    return true;

    function pause() {
      return new Promise((resolve, reject) => setTimeout(() => {
        resolve();
      }, 500));
    }
  });

  describe('1', () => {
    it('should register visitor', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/visitor/register`,
        headers: {},
        body: {
          firstName: 'first',
          lastName: 'last',
          email: 'vetalitty@gmail.com',
          password: '1q',
        },
        json: true,
      };
      const res = await request(options);
      expect(res.code).to.equal('OK');
    });

    it('should login as VISITOR', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/users/login`,
        headers: {},
        body: {
          email: 'vetalitty@gmail.com',
          password: '1q',
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      token.visitor = `JWT ${res.user.token}`;
      expect(res.code).to.equal('OK');
    });

    it('should login as VISITOR 5@aaa.ru', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/users/login`,
        headers: {},
        body: {
          email: '5@aaa.ru',
          password: '1q',
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      populateData.visitor = res.user;
      expect(res.code).to.equal('OK');
    });

    it('should login as RESTAURANT 1@aaa.ru', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/users/login`,
        headers: {},
        body: {
          email: '1@aaa.ru',
          password: '1q',
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      populateData.restaurant = res.user;
      expect(res.code).to.equal('OK');
    });

    it('should login as WAITER 3@aaa.ru', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/users/login`,
        headers: {},
        body: {
          email: '3@aaa.ru',
          password: '1q',
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      populateData.waiter = res.user;
      expect(res.code).to.equal('OK');
    });

    it('should NOT register restaurant without jwt admin', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/restaurant/register`,
        headers: {},
        body: {
          firstName: 'first',
          lastName: 'last',
          email: 'test@test.com',
          password: '1q',
        },
        json: true,
      };
      let res;
      try { res = await request(options); } catch (e) { res = e.error; }
      console.log(res);
      expect(res.code).to.equal('UNAUTHORIZED');
    });

    it('should login as ADMIN', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/users/login`,
        headers: {},
        body: {
          email: 'admin@asdf.com',
          password: '1q',
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      token.admin = `JWT ${res.user.token}`;
      expect(res.code).to.equal('OK');
    });

    it('should register restaurant', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/restaurant/register`,
        headers: {
          Authorization: token.admin,
        },
        body: {
          name: 'new restaurant',
          address: 'new address',
          email: 'hello@world.ru',
          password: '1q',
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
    });

    it('should login as RESTAURANT', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/users/login`,
        headers: {},
        body: {
          email: 'hello@world.ru',
          password: '1q',
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      token.restaurant = `JWT ${res.user.token}`;
      expect(res.code).to.equal('OK');
    });

    it('should return link for restaurant', async () => {
      const options = {
        method: 'get',
        uri: `${baseUrl}/restaurant/regtoken`,
        headers: {
          Authorization: token.restaurant,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
    });

    it('should get list of restaurants', async () => {
      const options = {
        method: 'get',
        uri: `${baseUrl}/restaurant`,
        headers: {
          Authorization: token.admin,
        },
        json: true,
      };
      let res;
      try { res = await request(options); } catch (e) { res = e.error; }
      console.log(res);
      idDelRestaurant = res.restaurants[0].id;
      expect(res.code).to.equal('OK');
    });

    it('should get list of visitors', async () => {
      const options = {
        method: 'get',
        uri: `${baseUrl}/visitor`,
        headers: {
          Authorization: token.admin,
        },
        json: true,
      };
      let res;
      try { res = await request(options); } catch (e) { res = e.error; }
      console.log(res);
      const visitors = res.visitors;
      for (let i = 0; i < visitors.length; i++) {
        if (visitors[i].email === 'vetalitty@gmail.com') {
          idDelVisitor = visitors[i].id;
        }
      }
      expect(res.code).to.equal('OK');
    });

    it('should return link for restaurant with JWT ADMIN', async () => {
      const options = {
        method: 'get',
        uri: `${baseUrl}/restaurant/regtoken?restaurantId=${idDelRestaurant}`,
        headers: {
          Authorization: token.admin,
        },
        json: true,
      };
      let res;
      try { res = await request(options); } catch (e) { res = e.error; }
      console.log(res);
      restaurantId = res.token;
      expect(res.code).to.equal('OK');
    });

    it('should register waiter', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/waiter/register`,
        headers: {},
        body: {
          password: '1q',
          email: 'w1@mmm.ru',
          restaurantId,
          lastName: 'last',
          firstName: 'first',
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
    });

    it('should login as WAITER', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/users/login`,
        headers: {},
        body: {
          email: 'w1@mmm.ru',
          password: '1q',
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      token.waiter = `JWT ${res.user.token}`;
      expect(res.code).to.equal('OK');
    });
  });

  describe('Get list of waiters', () => {
    it('should get list of waiters ADMIN', async () => {
      const options = {
        method: 'get',
        uri: `${baseUrl}/waiter`,
        headers: {
          Authorization: token.admin,
        },
        json: true,
      };
      let res;
      try { res = await request(options); } catch (e) { res = e.error; }
      console.log(res);
      const waiters = res.waiters;
      for (let i = 0; i < waiters.length; i++) {
        if (waiters[i].email === 'w1@mmm.ru') {
          idDelWaiter = waiters[i].id;
        }
      }
      expect(res.code).to.equal('OK');
    });

    it('should get list of waiters AS RESTAURANT', async () => {
      const options = {
        method: 'get',
        uri: `${baseUrl}/waiter`,
        headers: {
          Authorization: `JWT ${populateData.restaurant.token}`,
        },
        json: true,
      };
      let res;
      try { res = await request(options); } catch (e) { res = e.error; }
      console.log(res);
      const waiters = res.waiters;
      for (let i = 0; i < waiters.length; i++) {
        if (waiters[i].email === 'w1@mmm.ru') {
          idDelWaiter = waiters[i].id;
        }
      }
      expect(res.code).to.equal('OK');
    });
  });

  describe('User info', () => {
    it('should get user info ADMIN', async () => {
      const options = {
        method: 'get',
        uri: `${baseUrl}/users/info`,
        headers: {
          Authorization: token.admin,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.info.type).to.equal('ADMIN');
    });

    it('should get user info VISITOR', async () => {
      const options = {
        method: 'get',
        uri: `${baseUrl}/users/info`,
        headers: {
          Authorization: token.visitor,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.info.email).to.equal('vetalitty@gmail.com');
    });

    it('should get user info RESTAURANT', async () => {
      const options = {
        method: 'get',
        uri: `${baseUrl}/users/info`,
        headers: {
          Authorization: token.restaurant,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.info.email).to.equal('hello@world.ru');
    });

    it('should get user info WAITER', async () => {
      const options = {
        method: 'get',
        uri: `${baseUrl}/users/info`,
        headers: {
          Authorization: token.waiter,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.info.email).to.equal('w1@mmm.ru');
    });
  });

  describe('2', () => {
    it('should return list of restaurants with waiters with card', async () => {
      const options = {
        method: 'get',
        uri: `${baseUrl}/restaurant/list/payment_verified`,
        headers: {
          Authorization: token.visitor,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
    });
  });

  describe('Tests', () => {
    it('should return sum tips for waiter 3@aaa.ru AS ADMIN', async () => {
      const options = {
        method: 'get',
        uri: `${baseUrl}/tips/sum?waiter=${populateData.waiter.id}`,
        headers: {
          Authorization: token.admin,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
      expect(res.sum).to.equal(200);
    });

    it('should return sum tips for waiter 3@aaa.ru AS WAITER', async () => {
      const options = {
        method: 'get',
        uri: `${baseUrl}/tips/sum`,
        headers: {
          Authorization: `JWT ${populateData.waiter.token}`,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
      expect(res.sum).to.equal(200);
    });

    it('should return sum tips for visitor 5@aaa.ru AS VISITOR', async () => {
      const options = {
        method: 'get',
        uri: `${baseUrl}/tips/sum`,
        headers: {
          Authorization: `JWT ${populateData.visitor.token}`,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
      expect(res.sum).to.equal(200);
    });

    it('should return sum tips for visitor 5@aaa.ru as ADMIN', async () => {
      const options = {
        method: 'get',
        uri: `${baseUrl}/tips/sum?visitor=${populateData.visitor.id}`,
        headers: {
          Authorization: token.admin,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
      expect(res.sum).to.equal(200);
    });

    it('should return sum tips for restaurant 1@aaa.ru AS RESTAURANT', async () => {
      const options = {
        method: 'get',
        uri: `${baseUrl}/tips/sum`,
        headers: {
          Authorization: `JWT ${populateData.restaurant.token}`,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
      expect(res.sum).to.equal(200);
    });

    it('should return sum tips for restaurant and his waiter AS RESTAURANT', async () => {
      // 1@aaa.ru, 3@aaa.ru
      const options = {
        method: 'get',
        uri: `${baseUrl}/tips/sum?waiter=${populateData.waiter.id}`,
        headers: {
          Authorization: `JWT ${populateData.restaurant.token}`,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
      expect(res.sum).to.equal(200);
    });

    it('should return sum tips for restaurant 1@aaa.ru AS ADMIN', async () => {
      const options = {
        method: 'get',
        uri: `${baseUrl}/tips/sum?restaurant=${populateData.restaurant.id}`,
        headers: {
          Authorization: token.admin,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
      expect(res.sum).to.equal(200);
    });

    it('should return sum tips for restaurant and his waiter AS ADMIN', async () => {
      // 1@aaa.ru, 3@aaa.ru
      const options = {
        method: 'get',
        uri: `${baseUrl}/tips/sum?restaurant=${populateData.restaurant.id}&waiter=${populateData.waiter.id}`,
        headers: {
          Authorization: token.admin,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
      expect(res.sum).to.equal(200);
    });
  });

  describe.skip('Mini payment flow', () => {
    it('should send tips AS VISITOR', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/tips/payment`,
        headers: {
          Authorization: token.visitor,
        },
        body: {
          price: 1234,
          visitorId: populateData.visitor.id,
          waiterId: populateData.waiter.id,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      forReview = res.saveCardToken;
      expect(res.code).to.equal('OK');
    });

    it('should send review AS VISITOR', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/tips/review`,
        body: {
          saveCardToken: `${forReview}`,
          message: 'very good personal',
          rating: 4,
        },
        headers: {
          Authorization: token.visitor,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
    });

    it('should NOT send review AS VISITOR 2', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/tips/review`,
        body: {
          saveCardToken: `${forReview}`,
          message: 'very good personal',
          rating: 4,
        },
        headers: {
          Authorization: token.visitor,
        },
        json: true,
      };
      let res;
      try { res = await request(options); } catch (e) { res = e.error; }
      console.log('res:', res);
      expect(res.code).to.equal('UNPROCESSABLE_ENTITY');
      expect(res.errors.ALREADY_EXIST).to.deep.equal(['review']);
    });
  });

  describe('Rating', () => {
    it('should return rating for waiter 3@aaa.ru AS ADMIN', async () => {
      const options = {
        method: 'get',
        uri: `${baseUrl}/users/rating?waiter=${populateData.waiter.id}`,
        headers: {
          Authorization: token.admin,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
      expect(res.rating).to.equal(4);
    });

    it('should return rating for waiter 3@aaa.ru AS WAITER', async () => {
      const options = {
        method: 'get',
        uri: `${baseUrl}/users/rating`,
        headers: {
          Authorization: `JWT ${populateData.waiter.token}`,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
      expect(res.rating).to.equal(4);
    });

    it('should return rating for restaurant 1@aaa.ru AS RESTAURANT', async () => {
      const options = {
        method: 'get',
        uri: `${baseUrl}/users/rating`,
        headers: {
          Authorization: `JWT ${populateData.restaurant.token}`,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
      expect(res.rating).to.equal(4);
    });

    it('should return rating for restaurant and his waiter AS RESTAURANT', async () => {
      // 1@aaa.ru, 3@aaa.ru
      const options = {
        method: 'get',
        uri: `${baseUrl}/users/rating?waiter=${populateData.waiter.id}`,
        headers: {
          Authorization: `JWT ${populateData.restaurant.token}`,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
      expect(res.rating).to.equal(4);
    });

    it('should return rating for restaurant 1@aaa.ru AS ADMIN', async () => {
      const options = {
        method: 'get',
        uri: `${baseUrl}/users/rating?restaurant=${populateData.restaurant.id}`,
        headers: {
          Authorization: token.admin,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
      expect(res.rating).to.equal(4);
    });

    it('should return rating for restaurant and his waiter AS ADMIN', async () => {
      // 1@aaa.ru, 3@aaa.ru
      const options = {
        method: 'get',
        uri: `${baseUrl}/users/rating?restaurant=${populateData.restaurant.id}&waiter=${populateData.waiter.id}`,
        headers: {
          Authorization: token.admin,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
      expect(res.rating).to.equal(4);
    });
  });

  describe('List of tips', () => {
    it('should return list of tips for waiter 3@aaa.ru AS WAITER', async () => {
      const options = {
        method: 'get',
        uri: `${baseUrl}/tips?dateStart=2012-12-01T00:00:00Z&dateEnd=2023-12-01T00:00:00Z`,
        headers: {
          Authorization: `JWT ${populateData.waiter.token}`,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
      expect(res.sum).to.equal(200);
      expect(res.avgRating).to.equal(4);
    });

    it('should return list of tips for waiter 3@aaa.ru AS ADMIN', async () => {
      const options = {
        method: 'get',
        uri: `${baseUrl}/tips?waiter=${populateData.waiter.id}`,
        headers: {
          Authorization: token.admin,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
      expect(res.sum).to.equal(200);
      expect(res.avgRating).to.equal(4);
    });

    it('should return list of tips for visitor 5@aaa.ru AS VISITOR', async () => {
      const options = {
        method: 'get',
        uri: `${baseUrl}/tips`,
        headers: {
          Authorization: `JWT ${populateData.visitor.token}`,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
      expect(res.sum).to.equal(200);
      expect(res.avgRating).to.equal(4);
    });

    // it('should return list of tips for visitor vetalitty@gmail.com AS VISITOR', async() => {
    //   const options = {
    //     method: 'get',
    //     uri: `${baseUrl}/tips`,
    //     headers: {
    //       Authorization: token.visitor
    //     },
    //     json: true
    //   };
    //   const res = await request(options);
    //   console.log(res);
    //   expect(res.code).to.equal('OK');
    //   expect(res.tips.length).to.equal(1);
    // });

    it('should return list of tips for restaurant 1@aaa.ru AS RESTAURANT', async () => {
      const options = {
        method: 'get',
        uri: `${baseUrl}/tips`,
        headers: {
          Authorization: `JWT ${populateData.restaurant.token}`,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
      expect(res.sum).to.equal(200);
      expect(res.avgRating).to.equal(4);
    });

    it('should return list of tips for restaurant with his waiter AS RESTAURANT', async () => {
      const options = {
        method: 'get',
        uri: `${baseUrl}/tips?waiter=${populateData.waiter.id}`,
        headers: {
          Authorization: `JWT ${populateData.restaurant.token}`,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
      expect(res.sum).to.equal(200);
      expect(res.avgRating).to.equal(4);
    });
  });

  describe('3', () => {
    it('should send tips AS NEW GUEST', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/tips/payment`,
        body: {
          guest: {
            firstName: 'new user firstName',
            lastName: 'new user lastName',
          },
          price: 1234,
          waiterId: populateData.waiter.id,
        },
        headers: {
          Authorization: `JWT ${populateData.visitor.token}`,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      forReview = res.saveCardToken;
      expect(res.code).to.equal('OK');
    });

    it('should NOT send tips AS guest with random creds', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/tips/payment`,
        headers: { guest: getUuid() },
        body: {
          price: 1234,
          visitorId: populateData.visitor.id,
          waiterId: populateData.waiter.id,
        },
        json: true,
      };
      let res;
      try { res = await request(options); } catch (e) { res = e.error; }
      console.log('res:', res);
      expect(res.code).to.equal('UNPROCESSABLE_ENTITY');
      expect(res.errors.NOT_EXIST).to.deep.equal(['guest']);
    });
  });

  describe.skip('Mini payment flow AS NEW GUEST', () => {
    it('should send tips AS NEW GUEST', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/tips/payment`,
        body: {
          guest: {
            firstName: 'new user firstName',
            lastName: 'new user lastName',
          },
          price: 1234,
          visitorId: populateData.visitor.id,
          waiterId: populateData.waiter.id,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      forReview = res.saveCardToken;
      guestId = res.guest;
      expect(res.code).to.equal('OK');
    });

    it('should send review AS NEW GUEST', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/tips/review`,
        body: {
          saveCardToken: `${forReview}`,
          message: 'very good personal',
          rating: 4,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
    });
  });

  describe('Full payment flow AS NEW GUEST', () => {
    let reviewToken;
    // let guestId;
    it('should send tips AS NEW GUEST', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/tips/payment`,
        body: {
          guest: {
            firstName: 'fullflow',
            lastName: 'fullflow',
          },
          price: 1234,
          waiterId: populateData.waiter.id,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      reviewToken = res.reviewToken;
      guestId = res.guest;
      expect(res.code).to.equal('OK');
    });

    it('emulate request from CloudPayments on Check', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/checkout/check`,
        form: {
          TransactionId: '82288524',
          Amount: '111.00',
          Currency: 'RUB',
          PaymentAmount: '111.00',
          PaymentCurrency: 'RUB',
          OperationType: 'Payment',
          InvoiceId: '',
          AccountId: reviewToken,
          SubscriptionId: '',
          Name: 'ADFAF',
          Email: '',
          DateTime: '2018-10-29 03:47:01',
          IpAddress: '31.44.247.3',
          IpCountry: 'RU',
          IpCity: 'Иркутск',
          IpRegion: 'Иркутская область',
          IpDistrict: 'Сибирский федеральный округ',
          IpLatitude: '52.275261',
          IpLongitude: '104.30864',
          CardFirstSix: '424242',
          CardLastFour: '4242',
          CardType: 'Visa',
          CardExpDate: '12/22',
          Issuer: 'Stripe Payments Uk Limited',
          IssuerBankCountry: 'GB',
          Description: 'Чаевые для Ivan Ivanov',
          TestMode: '1',
          Status: 'Completed',
          Data: `{"guest":"${guestId}","reviewToken":"${reviewToken}"}`,
        },
        headers: {
          name: 'content-type',
          value: 'application/x-www-form-urlencoded',
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal(0);
    });

    it('emulate request from CloudPayments on Pay', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/checkout/pay`,
        form: {
          TransactionId: '82288524',
          Amount: '111.00',
          Currency: 'RUB',
          PaymentAmount: '111.00',
          PaymentCurrency: 'RUB',
          OperationType: 'Payment',
          InvoiceId: '',
          AccountId: reviewToken,
          SubscriptionId: '',
          Name: 'ADFAF',
          Email: '',
          DateTime: '2018-10-29 03:47:15',
          IpAddress: '31.44.247.3',
          IpCountry: 'RU',
          IpCity: 'Иркутск',
          IpRegion: 'Иркутская область',
          IpDistrict: 'Сибирский федеральный округ',
          IpLatitude: '52.275261',
          IpLongitude: '104.30864',
          CardFirstSix: '424242',
          CardLastFour: '4242',
          CardType: 'Visa',
          CardExpDate: '12/22',
          Issuer: 'Stripe Payments Uk Limited',
          IssuerBankCountry: 'GB',
          Description: 'Чаевые для Ivan Ivanov',
          AuthCode: 'A1B2C3',
          Token: '477BBA133C182267FE5F086924ABDC5DB71F77BFC27F01F2843F2CDC69D89F05',
          TestMode: '1',
          Status: 'Completed',
          GatewayName: 'Test',
          Data: `{"guest":"${guestId}","reviewToken":"${reviewToken}"}`,
        },
        headers: {
          name: 'content-type',
          value: 'application/x-www-form-urlencoded',
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal(0);
    });

    it('should send review AS NEW GUEST', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/tips/review`,
        body: {
          saveCardToken: reviewToken,
          message: 'very good personal',
          rating: 5,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
    });
  });

  describe('4', () => {
    it('should get user info GUEST', async () => {
      const options = {
        method: 'get',
        uri: `${baseUrl}/users/info`,
        headers: {
          guest: guestId,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.info.firstName).to.equal('fullflow');
    });

    it('should register a new guest', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/guest/register`,
        body: {
          firstName: 'fffirst',
          lastName: 'lllast',
          email: 'newemail@guest.ru',
          password: '1q',
        },
        headers: {
          guest: guestId,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
    });

    it('should NOT send tips AS guest with random creds', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/tips/payment`,
        headers: {
          guest: getUuid(),
        },
        body: {
          price: 1234,
          visitorId: populateData.visitor.id,
          waiterId: populateData.waiter.id,
        },
        json: true,
      };
      let res;
      try { res = await request(options); } catch (e) { res = e.error; }
      console.log('res:', res);
      expect(res.code).to.equal('UNPROCESSABLE_ENTITY');
      expect(res.errors.NOT_EXIST).to.deep.equal(['guest']);
    });

    it.skip('should send mail and return restore token (EMAIL)', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/users/password/restore`,
        headers: {
          Authorization: token.admin,
        },
        body: { email: 'vetalitty@gmail.com' },
        json: true,
      };
      const res = await request(options);
      // token.restore = res.restoreToken;
      console.log(res);
      expect(res.code).to.equal('OK');
    });
  });

  describe('Full payment flow AS USER', () => {
    let reviewToken;
    let user;
    it('should send tips AS VISITOR', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/tips/payment`,
        headers: {
          Authorization: token.visitor,
        },
        body: {
          price: 1234,
          visitorId: populateData.visitor.id,
          waiterId: populateData.waiter.id,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      reviewToken = res.reviewToken;
      expect(res.code).to.equal('OK');
    });

    it('emulate request from CloudPayments on Check', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/checkout/check`,
        form: {
          TransactionId: '82288524',
          Amount: '111.00',
          Currency: 'RUB',
          PaymentAmount: '111.00',
          PaymentCurrency: 'RUB',
          OperationType: 'Payment',
          InvoiceId: '',
          AccountId: reviewToken,
          SubscriptionId: '',
          Name: 'ADFAF',
          Email: '',
          DateTime: '2018-10-29 03:47:01',
          IpAddress: '31.44.247.3',
          IpCountry: 'RU',
          IpCity: 'Иркутск',
          IpRegion: 'Иркутская область',
          IpDistrict: 'Сибирский федеральный округ',
          IpLatitude: '52.272687',
          IpLongitude: '104.28975',
          CardFirstSix: '424242',
          CardLastFour: '4242',
          CardType: 'Visa',
          CardExpDate: '12/22',
          Issuer: 'Stripe Payments Uk Limited',
          IssuerBankCountry: 'GB',
          Description: 'Чаевые для Ivan Ivanov',
          TestMode: '1',
          Status: 'Completed',
          Data: `{"JWT":"${token.visitor}","reviewToken":"${reviewToken}"}`,
        },
        headers: {
          name: 'content-type',
          value: 'application/x-www-form-urlencoded',
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal(0);
    });

    it('emulate request from CloudPayments on Pay', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/checkout/pay`,
        form: {
          TransactionId: '82288524',
          Amount: '111.00',
          Currency: 'RUB',
          PaymentAmount: '111.00',
          PaymentCurrency: 'RUB',
          OperationType: 'Payment',
          InvoiceId: '',
          AccountId: reviewToken,
          SubscriptionId: '',
          Name: 'ADFAF',
          Email: '',
          DateTime: '2018-10-29 03:47:15',
          IpAddress: '31.44.247.3',
          IpCountry: 'RU',
          IpCity: 'Иркутск',
          IpRegion: 'Иркутская область',
          IpDistrict: 'Сибирский федеральный округ',
          IpLatitude: '52.272687',
          IpLongitude: '104.28975',
          CardFirstSix: '424242',
          CardLastFour: '4242',
          CardType: 'Visa',
          CardExpDate: '12/22',
          Issuer: 'Stripe Payments Uk Limited',
          IssuerBankCountry: 'GB',
          Description: 'Чаевые для Ivan Ivanov',
          AuthCode: 'A1B2C3',
          Token: '477BBA133C182267FE5F086924ABDC5DB71F77BFC27F01F2843F2CDC69D89F05',
          TestMode: '1',
          Status: 'Completed',
          GatewayName: 'Test',
          Data: `{"JWT":"${token.visitor}","reviewToken":"${reviewToken}"}`,
        },
        headers: {
          name: 'content-type',
          value: 'application/x-www-form-urlencoded',
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal(0);
    });

    it('should send review AS VISITOR', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/tips/review`,
        body: {
          reviewToken: `${reviewToken}`,
          message: 'very good personal',
          rating: 4,
        },
        headers: {
          Authorization: token.visitor,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal('OK');
    });
  });

  describe('Add card as WAITER', () => {
    let reviewToken;
    let user;
    it('should init card add flow', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/card/add`,
        headers: {
          Authorization: token.waiter,
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      reviewToken = res.saveCardToken;
      expect(res.code).to.equal('OK');
    });

    it('emulate request from CloudPayments on Check', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/checkout/check`,
        form: {
          TransactionId: '82288524',
          Amount: '1.0',
          Currency: 'RUB',
          PaymentAmount: '111.00',
          PaymentCurrency: 'RUB',
          OperationType: 'Payment',
          InvoiceId: '',
          AccountId: reviewToken,
          SubscriptionId: '',
          Name: 'ADFAF',
          Email: '',
          DateTime: '2018-10-29 03:47:01',
          IpAddress: '31.44.247.3',
          IpCountry: 'RU',
          IpCity: 'Иркутск',
          IpRegion: 'Иркутская область',
          IpDistrict: 'Сибирский федеральный округ',
          IpLatitude: '52.272687',
          IpLongitude: '104.28975',
          CardFirstSix: '424242',
          CardLastFour: '4242',
          CardType: 'Visa',
          CardExpDate: '12/22',
          Issuer: 'Stripe Payments Uk Limited',
          IssuerBankCountry: 'GB',
          Description: 'Чаевые для Ivan Ivanov',
          TestMode: '1',
          Status: 'Completed',
          Data: `{"JWT":"${token.waiter}","reviewToken":"${reviewToken}"}`,
        },
        headers: {
          name: 'content-type',
          value: 'application/x-www-form-urlencoded',
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal(0);
    });

    it('emulate request from CloudPayments on Pay', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/checkout/pay`,
        form: {
          TransactionId: '82288524',
          Amount: '111.00',
          Currency: 'RUB',
          PaymentAmount: '111.00',
          PaymentCurrency: 'RUB',
          OperationType: 'Payment',
          InvoiceId: '',
          AccountId: reviewToken,
          SubscriptionId: '',
          Name: 'ADFAF',
          Email: '',
          DateTime: '2018-10-29 03:47:15',
          IpAddress: '31.44.247.3',
          IpCountry: 'RU',
          IpCity: 'Иркутск',
          IpRegion: 'Иркутская область',
          IpDistrict: 'Сибирский федеральный округ',
          IpLatitude: '52.272687',
          IpLongitude: '104.28975',
          CardFirstSix: '424242',
          CardLastFour: '4242',
          CardType: 'Visa',
          CardExpDate: '12/22',
          Issuer: 'Stripe Payments Uk Limited',
          IssuerBankCountry: 'GB',
          Description: 'Чаевые для Ivan Ivanov',
          AuthCode: 'A1B2C3',
          Token: '777477BBA133C182267FE5F086924A5DB71F77BFC27F01F2843F2CDC69D89F05',
          TestMode: '1',
          Status: 'Completed',
          GatewayName: 'Test',
          Data: `{"JWT":"${token.visitor}","reviewToken":"${reviewToken}"}`,
        },
        headers: {
          name: 'content-type',
          value: 'application/x-www-form-urlencoded',
        },
        json: true,
      };
      const res = await request(options);
      console.log(res);
      expect(res.code).to.equal(0);
    });
  });

  describe.skip('CRUD', () => {
    it('should update waiter', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/waiter/update`,
        headers: {
          Authorization: token.admin,
        },
        body: {
          userId: idDelWaiter,
          firstName: 'good name',
        },
        json: true,
      };
      let res = await request(options);
      console.log('1:', res);
      expect(res.code).to.equal('OK');

      const options2 = {
        method: 'get',
        uri: `${baseUrl}/waiter`,
        headers: {
          Authorization: token.admin,
        },
        json: true,
      };
      res = await request(options2);
      console.log(res);
      let flag = false;
      const waiters = res.waiters;
      for (let i = 0; i < waiters.length; i++) {
        if (waiters[i].id === idDelWaiter) {
          if (waiters[i].firstName === 'good name') {
            flag = true;
          }
        }
      }
      expect(flag).to.equal(true);
    });

    it('should NOT update waiter', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/waiter/update`,
        headers: {
          Authorization: token.admin,
        },
        body: {
          userId: getUuid(),
          firstName: 'good name',
        },
        json: true,
      };
      let res;
      try { res = await request(options); } catch (e) { res = e.error; }
      console.log('res:', res);
      expect(res.code).to.equal('UNPROCESSABLE_ENTITY');
    });

    it('should delete waiter', async () => {
      const options = {
        method: 'delete',
        uri: `${baseUrl}/waiter/${idDelWaiter}`,
        headers: {
          Authorization: token.admin,
        },
        json: true,
      };
      let res = await request(options);
      console.log('1:', res);
      expect(res.code).to.equal('OK');

      const options2 = {
        method: 'get',
        uri: `${baseUrl}/waiter`,
        headers: {
          Authorization: token.admin,
        },
        json: true,
      };
      res = await request(options2);
      const waiters = res.waiters;
      let flag = true;
      for (let i = 0; i < waiters.length; i++) {
        if (waiters[i].id === idDelWaiter) {
          flag = false;
        }
      }
      console.log(res);
      expect(flag).to.equal(true);
    });

    it('should NOT delete waiter because user is not exist', async () => {
      const options = {
        method: 'delete',
        uri: `${baseUrl}/waiter/${idDelWaiter}`,
        headers: {
          Authorization: token.admin,
        },
        json: true,
      };
      let res;
      try { res = await request(options); } catch (e) { res = e.error; }
      console.log('res:', res);
      expect(res.code).to.equal('UNPROCESSABLE_ENTITY');
    });

    it('should update restaurant', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/restaurant/update`,
        headers: {
          Authorization: token.admin,
        },
        body: {
          name: 'updated new restaurant',
          userId: idDelRestaurant,
        },
        json: true,
      };
      let res = await request(options);
      console.log('1:', res);
      expect(res.code).to.equal('OK');

      const options2 = {
        method: 'get',
        uri: `${baseUrl}/restaurant`,
        headers: {
          Authorization: token.admin,
        },
        json: true,
      };
      res = await request(options2);
      let flag;
      const rests = res.restaurants;
      for (let i = 0; i < rests.length; i++) {
        if (rests[i].id === idDelRestaurant) {
          if (rests[i].name === 'updated new restaurant') {
            flag = 'Restaurant is updated';
          }
        }
      }
      expect(flag).to.equal('Restaurant is updated');
    });

    it('should NOT update restaurant because user is not exist', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/restaurant/update`,
        headers: {
          Authorization: token.admin,
        },
        body: {
          name: 'updated new restaurant',
          userId: getUuid(),
        },
        json: true,
      };
      let res;
      try { res = await request(options); } catch (e) { res = e.error; }
      console.log('res:', res);
      expect(res.code).to.equal('UNPROCESSABLE_ENTITY');
    });

    it('should delete restaurant', async () => {
      const options = {
        method: 'delete',
        uri: `${baseUrl}/restaurant/${idDelRestaurant}`,
        headers: {
          Authorization: token.admin,
        },
        json: true,
      };
      let res = await request(options);
      token.restore = res.restoreToken;
      console.log('1:', res);
      expect(res.code).to.equal('OK');

      const options2 = {
        method: 'get',
        uri: `${baseUrl}/restaurant`,
        headers: {
          Authorization: token.admin,
        },
        json: true,
      };
      res = await request(options2);
      const rests = res.restaurants;
      for (let i = 0; i < rests.length; i++) {
        if (rests[i].id === idDelRestaurant) {
          throw new Error('Restaurant is not deleted');
        }
      }
      console.log(res);
      expect(res.code).to.equal('OK');
    });

    it('should NOT delete restaurant because user is not exist', async () => {
      const options = {
        method: 'delete',
        uri: `${baseUrl}/restaurant/${idDelRestaurant}`,
        headers: {
          Authorization: token.admin,
        },
        json: true,
      };
      let res;
      try { res = await request(options); } catch (e) { res = e.error; }
      console.log('res:', res);
      expect(res.code).to.equal('UNPROCESSABLE_ENTITY');
    });

    it('should update visitor', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/visitor/update`,
        headers: {
          Authorization: token.admin,
        },
        body: {
          firstName: 'updatedVisitor',
          lastName: 'updatedVisitor',
          userId: idDelVisitor,
        },
        json: true,
      };
      let res = await request(options);
      console.log('1:', res);
      expect(res.code).to.equal('OK');

      const options2 = {
        method: 'get',
        uri: `${baseUrl}/visitor`,
        headers: {
          Authorization: token.admin,
        },
        json: true,
      };
      res = await request(options2);
      let flag;
      const visitors = res.visitors;
      for (let i = 0; i < visitors.length; i++) {
        if (visitors[i].id === idDelVisitor) {
          if (visitors[i].firstName === 'updatedVisitor') {
            flag = 'updatedVisitor';
          }
        }
      }
      expect(flag).to.equal('updatedVisitor');
    });

    it('should NOT update visitor because user is not exist', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/visitor/update`,
        headers: {
          Authorization: token.admin,
        },
        body: {
          firstName: 'updatedVisitor',
          lastName: 'updatedVisitor',
          userId: getUuid(),
        },
        json: true,
      };
      let res;
      try { res = await request(options); } catch (e) { res = e.error; }
      console.log('res:', res);
      expect(res.code).to.equal('UNPROCESSABLE_ENTITY');
    });

    it('should delete visitor', async () => {
      const options = {
        method: 'delete',
        uri: `${baseUrl}/visitor/${idDelVisitor}`,
        headers: {
          Authorization: token.admin,
        },
        json: true,
      };
      let res = await request(options);
      console.log('res:', res);
      expect(res.code).to.equal('OK');

      const options2 = {
        method: 'get',
        uri: `${baseUrl}/visitor`,
        headers: {
          Authorization: token.admin,
        },
        json: true,
      };
      res = await request(options2);
      console.log(res);
      const visitors = res.visitors;
      let flag = true;
      for (let i = 0; i < visitors.length; i++) {
        if (visitors[i].id === idDelVisitor) {
          flag = false;
        }
      }
      console.log(res);
      expect(flag).to.equal(true);
    });

    it('should NOT delete visitor because id is already deleted', async () => {
      const options = {
        method: 'delete',
        uri: `${baseUrl}/visitor/${idDelVisitor}`,
        headers: {
          Authorization: token.admin,
        },
        json: true,
      };
      let res;
      try { res = await request(options); } catch (e) { res = e.error; }
      console.log('res:', res);
      expect(res.code).to.equal('UNPROCESSABLE_ENTITY');
    });

    it('should NOT change password', async () => {
      const options = {
        method: 'post',
        uri: `${baseUrl}/users/password/change`,
        headers: {
          Authorization: token.admin,
        },
        body: {
          token: getUuid(),
          newPassword: 'adsf',
        },
        json: true,
      };
      let res;
      try { res = await request(options); } catch (e) { res = e.error; }
      console.log('res:', res);
      expect(res.code).to.equal('UNPROCESSABLE_ENTITY');
    });
  });

  it.skip('should send restaurant ticket EMAIL', async () => {
    const options = {
      method: 'post',
      uri: `${baseUrl}/restaurant/ticket`,
      headers: {
        Authorization: token.admin,
      },
      body: {
        name: 'Hello World',
        phone: '+79992345352',
        comment: 'my first query',
      },
      json: true,
    };
    const res = await request(options);
    console.log('1:', res);
    expect(res.code).to.equal('OK');
  });
});
