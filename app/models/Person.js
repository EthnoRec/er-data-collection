var Sequelize = require("sequelize");
var _ = require("underscore");
var moment = require("moment");
var util = require("util");
var Promise = require("bluebird");

var config = require("app/config");
var log = require("app/logger");

var bulkIgnoreDuplicates = require("./utils").bulkIgnoreDuplicates;
var NoUniqueRecordsError = require("./utils").NoUniqueRecordsError;


var Image = require("./Image");

var personFromTinder = function(p,location) {
    p = _.pick(p, "_id", "distance_mi", "name", "gender", "date_of_birth");
    p.date_of_birth = moment(p.date_of_birth).unix();
    p.origin_lat = location.lat;
    p.origin_long = location.long;
    return p;
};

var processImages = function(ps) {
    // [Promise<[Image]>]
    var imgPromises = _.map(ps,function(p){return Image.bulkCreateFromTinder(p.photos);});
    return Promise.each(imgPromises,function(images){
        var badImageIds = _(images).reject(function(image){
            // reject images that saved successfully
            return image.download();
        }).map(function(image){
            return image._id;
        });

        // wait until bad images are deleted
        if (badImageIds.length > 0) {
            return Image.destroy({where: {_id: {$in: badImageIds}}});
        }
    });
};



var def = function(seq) {
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
            bulkCreateFromTinder: function (ps, location) {
                var sum = function(a){return _.reduce(a,function(s,x){return s+x;},0);};
                log.debug("[Person#bulkCreateFromTinder] - %d people (location=%j)", ps.length, location, {});
                return this.bulkCreate(_.map(ps,function(p){return personFromTinder(p,location);}))
                    .then(function(people){
                        return processImages(ps)
                            .then(function(){
                                return people;
                            });
                    })
                    .catch(NoUniqueRecordsError,function(e){
                        log.warn("[Person::bulkCreateFromTinder] - (%s) %s",e.name,e.message);
                    })
                    .catch(Sequelize.UniqueConstraintError,function(e){
                        log.error("[Person::bulkCreateFromTinder] - (%s) Insert failed",e.name,e);
                    });
            }
        }
    });
    bulkIgnoreDuplicates(Person);
    Person.PersonNotFoundError = function(_id){
        this.name = "PersonNotFoundError";
        this.message = util.format("The person with _id=%s could not be found",_id);
    };
    Person.PersonNotFoundError.prototype = Object.create(Error.prototype, { 
          constructor: { value: Person.PersonNotFoundError } 
    });
    return Person;
};



module.exports = def;

//if (process.env.NODE_ENV == "test") {
    //module.exports.processImages = processImages;
//}
