var express = require("express");
var router = express.Router();

var _ = require("underscore");
var Promise = require("bluebird");
var log = require("app/logger");

var FaceDetection = require("app/models").FaceDetection;
var Box = require("app/models").Box;
var Image = require("app/models").Image;
var Person = require("app/models").Person;
var Location = require("app/models").Location;

router.get("/detection/list.html",function(req,res){

    var table = function(loc) {
        var personWhere = {};
        var fdWhere = {};
        fdWhere.component = 6;
        fdWhere.score = {$ne: null};

        var fdOrder = "score DESC";

        if (req.query.gender) {
            personWhere.gender = req.query.gender;
        }
        if (req.query.quality) {
            if (req.query.quality == "mq") {
                var median = -0.108765; 
                fdWhere.score.$between = [median-0.1, median+0.1];
            } else if (req.query.quality == "lq") {
                fdOrder = "score ASC";
            }
        }
        if (loc) {
            personWhere.origin_lat = loc.lat;
            personWhere.origin_long = loc.long;
        }

        FaceDetection.findAll({
            where: fdWhere, 
            order: fdOrder, 
            limit: 100,
            include: [{ 
                model: Image, include: [{
                    model: Person,
                    where: personWhere
                }] 
            }]
        }).then(function(fds){
            res.render("detection/list",{items:fds});
        });
    };

    if (req.query.city) {
        Location.find({where: {city: req.query.city}}).then(table);
    } else {
        table();
    }

});
router.get("/detection/list.csv",function(req,res){
    FaceDetection.findAll({where:"score is not NULL", order: "_id ASC",
        include:[ {model: Box, where: "\"Boxes\".part_index is NULL" } ]})
    .then(function(fds){
        var str = "id,score,component,box_origin_x,box_origin_y,box_extent_x,box_extent_y,image_id\n";
        res.set("Content-Type", "text/csv");
        fds.forEach(function(fd){
            var bbox = fd.Boxes[0];
            str += fd._id+","+fd.score+","+fd.component+",";
            str += [bbox.origin_x,bbox.origin_y,bbox.extent_x,bbox.extent_y].join(",")+",";
            str += fd.image_id+"\n";
        });
        res.send(str);
    });
});
module.exports = router;
