var Sequelize = require("sequelize");
var _ = require("underscore");
var config = require("../config");
var log = require("../logger");

var seq = new Sequelize(config.db.database, config.db.username, config.db.password, config.db);

var DetectionJob = require("./DetectionJob")(seq);
var Person = require("./Person")(seq);
var Image = require("./Image")(seq);
var Box = require("./Box")(seq);
var FaceDetection = require("./FaceDetection")(seq);
var Location = require("./Location")(seq);

Person.hasMany(Image,{
    foreignKey: {
        name: "person_id",
        allowNull: true
    }
});
Person.hasMany(Image,{
    foreignKey: {
        name: "person_id",
        allowNull: true
    }
});

Image.belongsTo(Person,{
    foreignKey: {
        name: "person_id",
        allowNull: true
    }
});

Image.hasMany(FaceDetection,{
    foreignKey: {
        name: "image_id",
        allowNull: false
    }
});

Image.belongsTo(DetectionJob,{
    foreignKey: {
        name: "detection_job_id",
        allowNull: true
    }
});
DetectionJob.hasMany(Image,{
    foreignKey: {
        name: "detection_job_id",
        allowNull: true
    }
});


FaceDetection.hasMany(Box,{
    foreignKey: {
        name: "fd_id",
        allowNull: false
    }
});
FaceDetection.belongsTo(Image,{
    foreignKey: {
        name: "image_id",
        allowNull: false
    }
});
module.exports.sequelize = seq;

module.exports.DetectionJob = DetectionJob;
module.exports.Person = Person;
module.exports.Image = Image;
module.exports.FaceDetection = FaceDetection;
module.exports.Box = Box;
module.exports.Location = Location;
