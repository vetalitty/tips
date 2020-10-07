const uuid = require('uuid');
const db = require('../database').restaurantTicket;
const Email = require('../lib/email');
const config = require('../config');

module.exports = {
  /**
   * Register ticket for restaurant and send email with this ticket
   * @param {object} ctx - context
   * @param {object} ctx.request.body - body of response
   * @param {object} ctx.body - response body
   * */
  async regTicket(ctx) {
    let body = ctx.request.body || {};

    body = await ctx.app.schemas.restaurantTicket.validate(body);

    const template = config.letters.template;
    const templateText = `${template.name} ${body.name}<br>
                          ${template.phone} ${body.phone} <br>
                          ${template.comment} ${body.comment}`;
    const subject = template.subject;

    // insert info about ticket in database
    const ticket = {};
    ticket.id = uuid.v4();
    ticket.name = body.name;
    ticket.phone = body.phone;
    ticket.comment = body.comment;
    await db.regTicket(ticket);

    const email = new Email();
    email.addUsers([config.letters.to]);
    email.addSubject([subject]);
    email.addMessages([templateText]);
    email.send();

    ctx.body = { message: 'success' };
  },
};
