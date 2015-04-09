var Sequelize = require("sequelize");
var request = require("request");
var fs = require("fs");
var path = require("path");
var cv = require("opencv");
var Promise = require("bluebird");
var _ = require("underscore");
//var moment = require("moment");
//var util = require("util");

var config = require("../config");
var log = require("../logger");

var bulkIgnoreDuplicates = require("./utils").bulkIgnoreDuplicates;
var NoUniqueRecordsError = require("./utils").NoUniqueRecordsError;

var _ = require("underscore");



var def = function(seq) {
    var imageFromTinder = function(img) {
        var dimg = {};
        var uid = img.url.match(/.*gotinder.com\/(.*)\//)[1];
        dimg._id = img.fileName.split(".")[0];
        dimg.ext = img.fileName.split(".")[1];
        dimg.person_id = uid;
        dimg.url = img.url;
        return dimg;
    };
    var TImage = seq.define("Image", {
        _id: {primaryKey: true, type: Sequelize.CHAR(36), allowNull: false},
        ext: Sequelize.STRING(4),
        url: Sequelize.STRING
    }, {
        classMethods: {
            bulkCreateFromTinder: function(photos) {
               return this.bulkCreate(_.map(photos,function(p){
                   return Image.imageFromTinder(p);
               }))
               .catch(NoUniqueRecordsError,function(e){
                   log.warn("[Image::bulkCreateFromTinder] - (%s) %s",e.name,e.message);
               })
               .catch(Sequelize.UniqueConstraintError,function(e){
                   log.error("[Image::bulkCreateFromTinder] - (%s) Insert failed",e.name,e);
               });
            }
        },
        instanceMethods: {
            download: function() {
                var f = function(){
                    try {
                        request.get(this.url)
                            .pipe(fs.createWriteStream(
                                    path.join(process.cwd(),config.gather.image_dir,this._id+"."+this.ext)));
                        return 1;
                    } catch(e) {
                        log.error("[Image#download] - %s",e);
                        return 0;
                    }
                };
                return (Image.instanceDownload || f).call(this);
            },
            showDetections: function() {
                var imdbp = Promise.resolve(this);
                var imp = Promise.promisify(cv.readImage)(path.join(config.gather.image_dir,this._id+"."+this.ext));
                var detectionsp = this.getFaceDetections();
                return Promise.join(imdbp,imp,detectionsp).spread(function(imdb,im,detections){
                    return Promise.all(_.map(detections,function(detection){return detection.getBoxes();}))
                    .each(function(boxes){
                        _.each(boxes,function(box){
                            var w = box.extent_x - box.origin_x;
                            var h = box.extent_y - box.origin_y;
                            if (box.part_index != null) {
                                im.rectangle([box.origin_x,box.origin_y],[w,h],[255,0,0]);
                                var opts = {
                                    center: {x:box.origin_x+w*0.5,y:box.origin_y+h*0.5},
                                    axes: {width:2,height:2},
                                    color: [0,0,255],
                                    thickness: 2
                                };
                                im.ellipse(opts);
                            } else {
                                im.rectangle([box.origin_x,box.origin_y],[w,h],[255,0,255]);
                            }
                        });
                    })
                    .then(function(){
                        return im;
                    });
                });
            }
        }
    });
    TImage.imageFromTinder = imageFromTinder;
    bulkIgnoreDuplicates(TImage);
    return TImage
};


//Image.hasMany(FaceDetection,{
    //foreignKey: {
        //name: "image_id",
        //allowNull: false
    //}
//});


module.exports = def;

