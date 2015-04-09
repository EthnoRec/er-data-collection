var Sequelize = require("sequelize");
//var _ = require("underscore");
//var moment = require("moment");
//var util = require("util");

var config = require("../config");
//var log = require("../logger");
//var Box = require("./Box");


var def = function(seq) {
    var FaceDetection = seq.define("FaceDetection", {
        _id: {primaryKey: true, type: Sequelize.INTEGER, autoIncrement: true, allowNull: false},
        score: Sequelize.FLOAT,
        component: Sequelize.INTEGER
    }, {});
    return FaceDetection;
};




module.exports = def;
