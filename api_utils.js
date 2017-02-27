const keys = require('./keys')
const mailgun = require('mailgun-js')({apiKey: keys.emailKey, domain: keys.emailDomain});
const twilio = require('twilio');
const client = twilio(keys.twilioKey, keys.twilioID);

module.exports.sendEmail = (recipient, message) => {
  let data = {
    from: 'Mailgun Sandbox <postmaster@sandbox44cda2e06ef8459d8a4b65d5038f6d39.mailgun.org>',
    to: 'rnesh90@yahoo.com',
    subject: 'Hello',
    text: `recipient : ${recipient}, message: ${message}`
  };
  mailgun.messages().send(data, function (error, body) {
  console.log(body);
  });
}

module.exports.sendText = (recipient, text) => {
  console.log(recipient, text);
  client.sendMessage({
    to : '7144864486',
    from: '12134863241',
    body: `rec:${recipient} txt:${text}`
  })
}