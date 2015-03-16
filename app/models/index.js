var Sequelize = require("sequelize");
var config = require("../config");

var seq = new Sequelize(config.db.database, config.db.username, config.db.password, config.db);

module.exports.sequelize = seq;
