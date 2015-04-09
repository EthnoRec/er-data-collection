var Sequelize = require("sequelize");

var def = function(seq) {
    var DetectionJob = seq.define("DetectionJob", {
        _id: {primaryKey: true, allowNull: false, type: Sequelize.INTEGER, autoIncrement: true},
        status: {type: Sequelize.ENUM("started","finished"), allowNull: true}
    });
    return DetectionJob;
}


module.exports = def;
