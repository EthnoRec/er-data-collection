var express = require("express");
var Promise = require("bluebird");
var router = express.Router();
var log = require("app/logger");

var DetectionJob = require("app/models").DetectionJob;
var Image = require("app/models").Image;

router.post("/detection/job",function(req,res){
    // {images: 10}
    var imagesn = req.body.images;
    
    var jobless_images = Image.findAll({limit:imagesn,where:{detection_job_id:null}});
    Promise.join(DetectionJob.create({}),jobless_images,function(dj,images){
        var img_ids = images.map(function(image){return image._id;});
        return Promise.update({detection_job_id:dj._id},{where:{_id: {$in:img_ids}}})
        //return Promise.each(images,function(image){
            //return image.setDetectionJob(dj);
        //})
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
