const Nodemailer = require('./nodemailer');

/**
 * Abstract class for send messages.
 */
class Message {
  constructor() {
    this.messages = [];
    this.users = [];
  }

  addUsers(users) {
    this.users = users;
  }

  addMessages(messages) {
    this.messages = messages;
  }

  async send() {
    const promisesSend = [];
    for (let i = 0; i < this.users.length; i++) {
      const module = new Nodemailer();
      this.setParamModule(module, i);
      promisesSend.push(module.send());
    }
    return Promise.all(promisesSend);
  }

  setParamModule(module, i) {
    module.setUser(this.users[i]);
    module.setMsg(this.messages[i]);
  }
}

module.exports = Message;
