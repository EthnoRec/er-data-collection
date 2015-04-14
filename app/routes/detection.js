var express = require("express");
var router = express.Router();

var _ = require("underscore");
var Promise = require("bluebird");
var log = require("app/logger");

var FaceDetection = require("app/models").FaceDetection;
var Box = require("app/models").Box;

router.get("/detection/list.html",function(req,res){
    FaceDetection.findAll({where:"score is not NULL", order: "score DESC"}).then(function(fds){
        res.render("detection/list",{items:fds});
    });
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
