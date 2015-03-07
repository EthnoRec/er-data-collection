var Sequelize = require("sequelize");
var _ = require("underscore");
var log = require("../logger");
var moment = require("moment");

var config = require("../config");

var seq = new Sequelize(config.db.database, config.db.username, config.db.password, config.db);

var personFromTinder = function(p,location) {
    p = _.pick(p, "_id", "distance_mi", "name", "gender", "date_of_birth");
    p.date_of_birth = moment(p.date_of_birth).unix();
    p.origin_lat = location.lat;
    p.origin_long = location.long;
    return p;
};

var Person = seq.define("Person", {
    _id: {primaryKey: true, type: Sequelize.CHAR(24), allowNull: false},
    distance_mi: Sequelize.INTEGER,
    name: Sequelize.STRING,
    gender: Sequelize.INTEGER(2),
    date_of_birth: Sequelize.INTEGER,
    origin_lat: Sequelize.FLOAT,
    origin_long: Sequelize.FLOAT
}, {
    classMethods: {
        createFromTinder: function (p, location) {
            log.debug("[Person#createFromTinder] - %j (location=%j)", p, location, {});
            return this.create(p);
        },
        bulkCreateFromTinder: function (ps, location) {
            log.debug("[Person#bulkCreateFromTinder] - %d people (location=%j)", ps.length, location, {});
            return this.bulkCreate(_.map(ps,function(p){return personFromTinder(p,location);}),
                {ignoreDuplicates:true});
        }
    }
});

module.exports = Person;
