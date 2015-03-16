var Sequelize = require("sequelize");
//var _ = require("underscore");
//var moment = require("moment");
//var util = require("util");

var config = require("../config");
//var log = require("../logger");
var Box = require("./Box");

var seq = require("./index").sequelize;

var FaceDetection = seq.define("FaceDetection", {
    _id: {primaryKey: true, type: Sequelize.INTEGER, autoIncrement: true, allowNull: false},
    score: Sequelize.FLOAT,
    component: Sequelize.INTEGER
}, {});


FaceDetection.hasMany(Box,{
    foreignKey: {
        name: "fd_id",
        allowNull: false
    }
});


module.exports = FaceDetection;
