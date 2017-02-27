const Sequelize = require('sequelize');
const cred = require('./keys.js');

var db = new Sequelize('atexta', cred.username, cred.password, {
 host: cred.connection,
 port : 3306,
 dialect: 'mysql',

 pool: {
   max: 5,
   min: 0,
   idle: 10000
 }
});

module.exports = db;
