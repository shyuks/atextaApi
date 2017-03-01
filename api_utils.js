const mailgun = require('mailgun-js')({apiKey: process.env.EMAIL_KEY, domain: process.env.EMAIL_DOMAIN});
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_KEY, process.env.TWILIO_ID);

module.exports.sendEmail = (recipient, message) => {
  let data = {
    from: 'MyAtexta.com <postmaster@mg.myatexta.com>',
    to: recipient,
    subject: `Sent from ${recipient.UserName}'s Atexta skill`,
    text: `message: ${message}`
  };
  mailgun.messages().send(data, function (error, body) {
  });
}

module.exports.sendText = (recipient, text) => {
  client.sendMessage({
    to : recipient,
    from: '12134863241',
    body: `From ${recipient.UserName}'s Atexta Skill: ${text}`
  })
}