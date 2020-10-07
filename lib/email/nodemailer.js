const nodemailer = require('nodemailer');

const config = require('../../config').letters;

const transporter = nodemailer.createTransport(
  {
    service: 'gmail',
    auth: {
      user: config.email,
      pass: config.pswd,
    },
  },
);


/**
 * Class for send email with nodemailer.
 */
class Nodemailer {
  constructor() {
    this.user = null;
    this.msg = '';
    this.file = null;
    this.subject = null;
  }

  setUser(user) {
    this.user = user;
  }

  setMsg(msg) {
    this.msg = msg;
  }

  setSubject(subject) {
    this.subject = subject;
  }

  setFile(file) {
    this.file = file;
  }

  send() {
    return new Promise((resolve, reject) => {
      const params = {
        from: config.email,
        to: this.user,
        subject: this.subject,
        html: this.msg,
        attachments: this.file,
      };
      console.log(params);
      transporter.sendMail(params, (err) => {
        console.log(err);
        if (err) {
          reject(err);
        } else {
          resolve('Email has been sending');
        }
      });
    });
  }
}

module.exports = Nodemailer;
