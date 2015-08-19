var express = require("express");
var Promise = require("bluebird");
var router = express.Router();
var log = require("app/logger");
var util = require("util");

var DetectionJob = require("app/models").DetectionJob;
var Image = require("app/models").Image;
var Person = require("app/models").Person;

router.post("/detection/job",function(req,res){
    // {images: 10, location:{lat,long}, gender: 0}
    var imagesn = req.body.images;
    var location = req.body.location;
    var gender = req.body.gender;

    var query = { 
        limit: imagesn, 
        where: {detection_job_id: null}
    };

    // TODO: use gender filter even if no location specified
    if (location) {
        query.include = [{model: Person, where: {
            $and: [
                util.format("gender = %d",gender),
                util.format("abs(origin_lat - %d) < 1",location.lat),
                util.format("abs(origin_long - %d) < 1",location.long)
            ]}
        }];
    }
    
    var jobless_images = Image.findAll(query);
    Promise.join(DetectionJob.create({}),jobless_images,function(dj,images){
        var img_ids = images.map(function(image){return image._id;});
        return Image.update({detection_job_id:dj._id},{where:{_id: {$in:img_ids}}})
        .then(function(){
            res.send({_id: dj._id});
        });
    })
    .catch(function(err){
        log.error("[%s %s] - (%s) %s",req.method,req.url,err.name,err.message,{});
        res.status(500).send(err);
    });
});

module.exports = router;
