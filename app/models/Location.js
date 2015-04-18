var Sequelize = require("sequelize");

var config = require("../config");
var def = function(seq) {
    var Location = seq.define("Location", {
        _id: {primaryKey: true, type: Sequelize.INTEGER, autoIncrement: true, allowNull: false},
        city: {type: Sequelize.STRING, allowNull: false},
        country: {type: Sequelize.STRING, allowNull: false},
        lat: {type: Sequelize.FLOAT, allowNull: false},
        long: {type: Sequelize.FLOAT, allowNull: false}
    }, {});
    return Location;
}


module.exports = def;
