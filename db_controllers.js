'use strict';
const db = require('./config');
const Sequelize = require('sequelize');
const http = require ('http');
const https = require ('https');
const moment = require('moment');
const utils = require('./api_utils');

module.exports.getUserInfo = (token) => {
  return new Promise ((resolve, reject) => {

  let options = {
  "method": "GET",
  "hostname": "rakan.auth0.com",
  "port": null,
  "path": "/userinfo",
  "headers": {
    "authorization": `Bearer ${token}`,
    "cache-control": "no-cache"
    }
  };

  let body = '';
  let req = https.request(options, res => {
    res.on('data', d => {
      body += d;
    })
    res.on('error', e => {
      reject(e);
    })
    res.on('end', ()=>{
      if (body === "Unauthorized") {
        resolve({invalidToken : true, body : body})
      } else {
        resolve(JSON.parse(body));
      }
    })
  })
  req.on('error', e => {
    reject(e);
  })
  req.end();
  })
}

module.exports.sendText = (groupInfo, message) => {
  groupInfo.forEach(recipient => {
    utils.sendText(recipient, message);
  })
}

module.exports.sendEmail = (groupInfo, message) => {
  groupInfo.forEach(recipient => {
    utils.sendEmail(recipient, message);
  })
}

module.exports.sendSlack = (groupInfo, message) => {
  groupInfo.forEach(recipient => {
    utils.sendSlack(recipient.contactInfo, message);
  })
}

module.exports.GetOrInsertUser = (userInfo) => {
  return new Promise ((resolve, reject) => {
    db.query('select * from Users where email = ?', {
      replacements: [userInfo.email],
      type: Sequelize.QueryTypes.SELECT
    })
    .then(result => {
      if (result.length === 0) {
        let currDate = moment().format();
        currDate = currDate.replace('T', ' ').substr(0, 19)
        db.query(`insert into Users (email, name, createdAt, updatedAt) value ("${userInfo.email}", "${userInfo.name}", "${currDate}", "${currDate}")`, {
          type: Sequelize.QueryTypes.INSERT
        })
        .then(createdUser => {
          resolve({newUser: true})
        })
        .catch(err => {
          reject(err);
        })
      } else {
        resolve(({newUser : false, userId : result[0].id}))
      }      
    })
    .catch(error => {
      reject(error);
    })
  })
}

module.exports.getIntentInfo = (inputUserId, commandName) => {
  return new Promise ((resolve, reject) => {
    db.query('select U.name as UserName, C.verified, C.id as CommandId, C.name as commandName, C.groupId, G.name as groupName, M.text, M.id as MessageId, R.name as recipientName, R.mediumType, R.contactInfo from Commands C join Users U on C.userId = U.id join Messages M on C.messageId = M.id left outer join Groups G on G.id = C.groupId left outer join GroupRecipients GR on GR.groupId = C.groupId left outer join Recipients R on R.id = GR.recipientId where C.userId = ? and UPPER(C.name) = UPPER(?) and C.status = 1', {
    replacements: [inputUserId, commandName],
    type: Sequelize.QueryTypes.SELECT
    })
    .then(foundCommand => {
      resolve(foundCommand);
    })
    .catch(error => {
      console.log(error);
      reject(error);
    })
  })
}

module.exports.GetSecretIntentInfo = (userEmail, trigger) => {
 return new Promise ((resolve, reject) => {
   db.query(`select SC.id as SecretCommandId, SC.triggerId, SC.secretMessageId, SC.responseId, SC.verified, SM.text, SR.speech, U.id, U.name as UserName, R.name, R.contactInfo, R.mediumType from SecretCommands SC join SecretTriggers ST on SC.triggerId = ST.id join SecretMessages SM on SC.secretMessageId = SM.id join SecretResponses SR on SC.responseId = SR.id join Users U on SC.userId = U.id join GroupRecipients GR on SC.groupId = GR.groupId join Recipients R on GR.recipientId = R.id where U.email = "${userEmail}" and SC.status = 1 and ST.name = "${trigger}"`, {
     type: Sequelize.QueryTypes.SELECT
   })
   .then(foundSecretCommand => {
    resolve(foundSecretCommand)
   })
   .catch(error => {
     console.log(error);
     reject(error);
   })
 })
}

module.exports.GetGroupInfo = (userEmail, groupName, type) => {
 return new Promise ((resolve, reject) => {
  let str = (type === '0' ? '' : "and G.mediumType = ?");
  let rep = (type === '0' ? [userEmail, groupName] : [userEmail, groupName, type]);
  db.query(`select U.id as userId, U.name as UserName, R.name, R.contactInfo, R.mediumType from Users U join Groups G on G.userId = U.id join GroupRecipients GR on GR.groupId = G.id join Recipients R on GR.recipientId = R.id where U.email = ? and UPPER(G.name) = UPPER(?) ${str}`,
  {replacements : rep, type : Sequelize.QueryTypes.SELECT})
  .then(groupInfo => {
    resolve(groupInfo)
  })
  .catch(error => {
    console.log(error);
    reject(error);
  })
 });
}

module.exports.IncrementTriggeredCommand = (userId, commandId) => {
  return new Promise ((resolve, reject) => {
    let currDate = moment().format();
    currDate = currDate.replace('T', ' ').substr(0, 19)
    db.query(`insert into TriggeredCommands (commandId, userId, createdAt, updatedAt) value ("${commandId}", "${userId}", "${currDate}", "${currDate}")`, {
    type: Sequelize.QueryTypes.INSERT })
    .then(res => {
      resolve({update : true})
    })
    .catch(err => {
      console.log(err);
      reject(err)
    })
  })
}

module.exports.IncrementTriggeredSecret = (userId, secretId) => {
  return new Promise ((resolve, reject) => {
    let currDate = moment().format();
    currDate = currDate.replace('T', ' ').substr(0, 19)
    db.query(`insert into TriggeredSecrets (SecretCommandId, userId, createdAt, updatedAt) value ("${secretId}", "${userId}", "${currDate}", "${currDate}")`, {
    type: Sequelize.QueryTypes.INSERT })
    .then(res => {
      resolve({update : true})
    })
    .catch(err => {
      console.log(err);
      reject(err)
    })    
  })
}

module.exports.IncrementMessageCount = (messageId) => {
  return new Promise ((resolve, reject) => {
    db.query(`update Messages set count = count+1 where id = ${messageId}`,
    {type : Sequelize.QueryTypes.UPDATE})
    .then(res => {
      resolve({update : true});
    })
    .catch(error => {
       console.log(error);
      reject(error);
    })
  })
}

module.exports.IncrementSecretMessageCount = (secretMessageId) => {
  return new Promise ((resolve, reject) => {
    db.query(`update SecretMessages set count = count+1 where id = ${secretMessageId}`, {
      type : Sequelize.QueryTypes.UPDATE
    })
    .then(res => {
      resolve({update : true})
    })
    .catch(error => {
       console.log(error);
      reject(error);
    })
  })
}

module.exports.IncrementSecretResponse = (secretResposneId) => {
  return new Promise ((resolve, reject) => {
    db.query(`update SecretResponses set count = count+1 where id = ${secretResposneId}`, {
      type : Sequelize.QueryTypes.UPDATE
    })
    .then(res => {
      resolve({update : true})
    })
    .catch(error => {
       console.log(error);
      reject(error)
    })
  })
}

module.exports.IncrementSecretTrigger = (triggerId) => {
  return new Promise ((resolve, reject) => {
    db.query(`update SecretTriggers set count = count+1 where id = ${triggerId}`, {
      type : Sequelize.QueryTypes.UPDATE
    })
    .then(result => {
      resolve({update : true})
    })
    .catch(error => {
       console.log(error);
      reject(error);
    })
  })
}

module.exports.ActivateCommand = (commandId) => {
  return new Promise ((resolve, reject) => {
    db.query(`update Commands set verified = 1 where id = ${commandId}`,{
      type : Sequelize.QueryTypes.UPDATE
    })
    .then(res => {
      resolve({activated : true})
    })
    .catch(error => {
       console.log(error);
      reject(error);
    })
  })
}

module.exports.ActivateSecretCommand = (secretCommandId) => {
  return new Promise ((resolve, reject) => {
    db.query(`update SecretCommands set verified = 1 where id = ${secretCommandId}`, {
      type : Sequelize.QueryTypes.UPDATE
    })
    .then(res => {
      resolve({activated : true})
    })
    .catch(error => {
       console.log(error);
      throw error;
      reject(error);
    })
  })
}
