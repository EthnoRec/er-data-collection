var Sequelize = require("sequelize");
var FaceDetection = require("app/models").FaceDetection;

var def = function(seq) {
    var DetectionJob = seq.define("DetectionJob", {
        _id: {primaryKey: true, allowNull: false, type: Sequelize.INTEGER, autoIncrement: true},
        status: {type: Sequelize.ENUM("started","finished"), allowNull: true}
    },{
        instanceMethods: {
            getUnprocessedImages: function() {
                var Image = DetectionJob.associations.DetectionJobsImages.target;
                var bad = '(select img._id from "Images" as img join "FaceDetections" as fd on fd.image_id = img._id where img.detection_job_id = '+this._id+')';
                return Image.findAll({where: {$and:["_id not in "+bad,{detection_job_id: this._id}]}});
            }
        }    
    });
    return DetectionJob;
}


module.exports = def;
