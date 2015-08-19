var Sequelize = require("sequelize");

var config = require("../config");
var def = function(seq) {
    var Box = seq.define("Box", {
        _id: {primaryKey: true, type: Sequelize.INTEGER, autoIncrement: true, allowNull: false},
        origin_x: {type: Sequelize.INTEGER, allowNull: false, defaultValue: 0},
        origin_y: {type: Sequelize.INTEGER, allowNull: false, defaultValue: 0},

        extent_x: {type: Sequelize.INTEGER, allowNull: false, defaultValue: 0},
        extent_y: {type: Sequelize.INTEGER, allowNull: false, defaultValue: 0},

        part_index: {type: Sequelize.INTEGER, allowNull: true, comment: "NULL means this Box is the outer box for its FaceDetection"}
    }, {});
    return Box;
}


module.exports = def;
