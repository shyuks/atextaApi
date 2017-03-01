require('dotenv').config()
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var port = process.env.PORT || 3000;
var db = require('./config');
var dc = require('./db_controllers');
var incomingRequests = [];
var https = require('https');

var app = express()

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, './index.html')))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './index.html'))
});

app.post('/fromAlexa', (req, res) => {
  incomingRequests.push(req.body);
  res.status(200).send('Added to request array');
})

app.get('/fromClient', (req, res) => {
  res.status(200).json(incomingRequests);
})

app.get('/intentResults', (req, res) => {
  res.status(200).json(sendResults);
})  

app.get('/triggerQuickCommand', (req, res) => {
  dc.getUserInfo(req.headers.token)
    .then(profile => {
    if (profile.invalidToken) {
      res.status(500).send(profile.body);
    } else {
      dc.GetOrInsertUser(profile)
      .then(result => {
        if (result.newUser) {
          res.status(200).json(result);
        } else {
          dc.getIntentInfo(result.userId, req.headers.commandname)
          .then(foundCommand => {
            if (foundCommand.length === 0) {
              res.status(200).send({NoCommand: true});
            } else if (foundCommand[0].verified === 0 ) {
              dc.ActivateCommand(foundCommand[0].CommandId)
              res.status(200).send({NotVerified : true})
            } else if (foundCommand[0].groupId === null) {
              res.status(200).send({NoGroup: true, email: profile.email, data: foundCommand[0]})
            } else {
              dc.IncrementMessageCount(foundCommand[0].MessageId)
              dc.IncrementTriggeredCommand(result.userId, foundCommand[0].CommandId)
              if (foundCommand[0].mediumType === 'T') {
                dc.sendText(foundCommand, foundCommand[0].text)
                res.status(200).send({sendText : true})
              } else if (foundCommand[0].mediumType === 'E') {
                dc.sendEmail(foundCommand, foundCommand[0].text);
                res.status(200).send({sendEmail : true})
              } else {
                res.status(200).send('issue with medium type')
              }
            }
          })
          .catch(error => {
             console.log(error);
            res.status(500).send(error);
          })
        }
      })
      .catch(error => {
         console.log(error);
        res.status(500).send(error);
      })
    }
  })
  .catch(error => {
     console.log(error);
    res.status(500).send(error);
  })
})

app.get('/sendToGroup', (req, res) => {
  dc.GetGroupInfo(req.headers.useremail, req.headers.groupname, req.headers.mediumtype)
  .then(groupInfo => {
    if (groupInfo.length === 0) {
      res.status(200).send({group : false})
    } else {
        dc.IncrementMessageCount(req.headers.messageid)
        dc.IncrementTriggeredCommand(groupInfo[0].userId, req.headers.commandid)
      if (groupInfo[0].mediumType === 'T') {
        dc.sendText(groupInfo, req.headers.message)
        res.status(200).send({sentText : true})
      } else if (groupInfo[0].mediumType === 'E') {
        dc.sendEmail(groupInfo, req.headers.message)
        res.status(200).send({sentEmail : true})
      } else {
        res.status(200).send('issue with getting group info')
      }
    }
  })
  .catch(error => {
     console.log(error);
    res.status(500).send(error);
  })
})

app.get('/sendCustomMessage', (req, res) => {
  dc.getUserInfo(req.headers.token)
  .then(profile => {
    if (profile.invalidToken) {
      res.status(500).send(profile.body);
    } else {
      dc.GetOrInsertUser(profile)
      .then(result => {
        if (result.newUser) {
          res.status(200).json(result);
        } else {
          dc.GetGroupInfo(profile.email, req.headers.groupname, req.headers.mediumtype)
          .then(groupInfo => {
            if (groupInfo.length === 0) {
              res.status(200).send({group : false})
            } else {
              if (groupInfo[0].mediumType === 'T') {
                dc.sendText(groupInfo, req.headers.message)
                res.status(200).send({sentText : true})
              } else if (groupInfo[0].mediumType === 'E') {
                dc.sendEmail(groupInfo, req.headers.message)
                res.status(200).send({sentEmail : true})
              } else {
                res.status(200).send('issue with getting group info')
              }
            }          
          })
          .catch(error => {
            res.status(500).send(error);
          })
        }
      })
      .catch(error => {
         console.log(error);
        res.status(500).send(error);
      })
    }
  })
  .catch(error => {
     console.log(error);
    res.status(500).send(error);
  })
})

app.get('/triggerSecretCommand', (req, res) => {
  dc.getUserInfo(req.headers.token)
  .then(profile => {
    if (profile.invalidToken) {
      res.status(200).send(profile.body);
    } else {
      dc.GetOrInsertUser(profile)
      .then(result => {
        if (result.newUser) {
          res.status(200).json(result)
        } else {
          dc.GetSecretIntentInfo(profile.email, req.headers.secrettrigger)
          .then(foundSecretCommand => {
            if (foundSecretCommand.length === 0) {
              res.status(200).send({NoCommand : true})
            } else if (foundSecretCommand[0].verified === 0) {
              dc.ActivateSecretCommand(foundSecretCommand[0].SecretCommandId)
              res.status(200).send({NotVerified : true})
            } else {
              dc.IncrementSecretMessageCount(foundSecretCommand[0].secretMessageId)
              dc.IncrementSecretResponse(foundSecretCommand[0].responseId)
              dc.IncrementSecretTrigger(foundSecretCommand[0].triggerId)
              dc.IncrementTriggeredSecret(result.userId, foundSecretCommand[0].SecretCommandId)
              if (foundSecretCommand[0].mediumType === 'T') {
                dc.sendText(foundSecretCommand, foundSecretCommand[0].text)
                res.status(200).send({response : foundSecretCommand[0].speech})
              } else if (foundSecretCommand[0].mediumType === 'E') {
                dc.sendEmail(foundSecretCommand, foundSecretCommand[0].text)
                res.status(200).send({response: foundSecretCommand[0].speech})
              } else {
                res.status(200).send('Error sending secret message')
              }
            }
          })
          .catch(error => {
             console.log(error);
            res.status(500).send(error);
          });
        }
      })
      .catch(error => {
         console.log(error);
        res.status(500).send(error);
      });
    }
  })
  .catch(error => {
     console.log(error);
    res.status(500).send(error);
  })
})

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, './index.html'))
})

db.sync()
.then(res => {
  app.listen(port, function(){
    console.log('Listening on localhost: '+ port);
  });
}).catch(error => {
  console.log(error);
})