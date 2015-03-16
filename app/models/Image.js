var Sequelize = require("sequelize");
var request = require("request");
var fs = require("fs");
var path = require("path");
//var _ = require("underscore");
//var moment = require("moment");
//var util = require("util");

var config = require("../config");
var log = require("../logger");
var FaceDetection = require("./FaceDetection");

var seq = require("./index").sequelize;
var _ = require("underscore");


var imageFromTinder = function(img) {
    var dimg = {};
    var uid = img.url.match(/.*gotinder.com\/(.*)\//)[1];
    dimg._id = img.fileName.split(".")[0];
    dimg.ext = img.fileName.split(".")[1];
    dimg.person_id = uid;
    dimg.url = img.url;
    return dimg;
};

var Image = seq.define("Image", {
    _id: {primaryKey: true, type: Sequelize.CHAR(36), allowNull: false},
    ext: Sequelize.STRING(4),
    url: Sequelize.STRING
}, {
    classMethods: {
        bulkCreateFromTinder: function(photos) {
           return this.bulkCreate(_.map(photos,function(p){return Image.imageFromTinder(p);}));
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
        }
    }
});


Image.hasMany(FaceDetection,{
    foreignKey: {
        name: "image_id",
        allowNull: false
    }
});


if (process.env.NODE_ENV == "test") {
    Image.imageFromTinder = imageFromTinder;
}
module.exports = Image;
