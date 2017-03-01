const mailgun = require('mailgun-js')({apiKey: process.env.EMAIL_KEY, domain: process.env.EMAIL_DOMAIN});
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_KEY, process.env.TWILIO_ID);

module.exports.sendEmail = (recipient, message) => {
  let data = {
    from: 'MyAtexta.com <postmaster@mg.myatexta.com>',
    to: recipient,
    subject: 'Sent from _\'s Atexta skill',
    text: `message: ${message}`
  };
  mailgun.messages().send(data, function (error, body) {
    console.log('body is', body);
    console.log('error is', error)
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