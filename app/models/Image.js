var Sequelize = require("sequelize");
//var _ = require("underscore");
//var moment = require("moment");
//var util = require("util");

var config = require("../config");
//var log = require("../logger");
var FaceDetection = require("./FaceDetection");

var seq = new Sequelize(config.db.database, config.db.username, config.db.password, config.db);

var Image = seq.define("Image", {
    _id: {primaryKey: true, type: Sequelize.CHAR(36), allowNull: false},
}, {});


Image.hasMany(FaceDetection,{
    foreignKey: {
        name: "image_id",
        allowNull: false
    }
});


module.exports = Image;
