var Sequelize = require("sequelize");
var _ = require("underscore");
var moment = require("moment");
var util = require("util");

var config = require("../config");
var log = require("../logger");

var seq = require("./index").sequelize;


var Image = require("./Image");

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


Person.hasMany(Image,{
    foreignKey: {
        name: "person_id",
        allowNull: false
    }
});

Person.PersonNotFoundError = function(_id){
    this.name = "PersonNotFoundError";
    this.message = util.format("The person with _id=%s could not be found",_id);
};
Person.PersonNotFoundError.prototype = Object.create(Error.prototype, { 
      constructor: { value: Person.PersonNotFoundError } 
});

module.exports = Person;

