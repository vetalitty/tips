const Message = require('./message');

/**
 * Class for send email.
 */
class Index extends Message {
  constructor() {
    super();
    this.files = [];
    this.subject = null;
  }

  addFiles(files) {
    this.files = files;
  }

  addSubject(subject) {
    this.subject = subject;
  }

  setParamModule(module, i) {
    super.setParamModule(module, i);
    module.setFile(this.files[i]);
    module.setSubject(this.subject[i]);
  }
}

module.exports = Index;
