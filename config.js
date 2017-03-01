const Sequelize = require('sequelize');
var db = new Sequelize('atexta', process.env.DB_USER, process.env.DB_PASSWORD, {
 host: process.env.DB_CONNECT,
 port : 3306,
 dialect: 'mysql',

 pool: {
   max: 5,
   min: 0,
   idle: 10000
 }
});

module.exports = db;
