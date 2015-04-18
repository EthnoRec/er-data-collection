var express = require("express");
var router = express.Router();
var _ = require("underscore");
var Promise = require("bluebird");
var Tinder = require("../Tinder").Tinder;
var Job = require("../Tinder").Job;

var log = require("../logger");

var withTinder = Promise.promisify(function(cb){
    if (!Tinder.tinder) {
        cb(new Tinder.TinderRequiredError());
    } else {
        cb();
    }
});

var withTinderJob = function(){
    return withTinder().then(function(){
        return Tinder.tinder.withJob();
    });
};

router.post("/job",function(req,res){
    // lat: 0.0, long: 0.0, limit: 10, retry_delay: 60*60
    log.debug("[%s %s] - %j",req.method,req.url,req.body,{});
    withTinder()
        .then(function(){
            return Tinder.tinder.submitJob(req.body);
        })
        .then(function(){
            res.status(201).send({message:null});
        })
        .catch(Tinder.TinderRequiredError,function(err){
            log.error("[%s %s] - (%s) %s",req.method,req.url,err.name,err.message,{});
            res.status(401).send(err);
        })
        .catch(function(err){
            log.error("[%s %s] - %s",req.method,req.url,err.message,{});
            console.log(err.stack);
            res.status(500).send(err.message);
        });
});

// Get Job status
router.get("/job",function(req,res){
    log.debug("[%s %s] - %j",req.method,req.url,req.body,{});
    // location: {lat: 0.0, long: 0.0},
    // limit: 10,
    // retry_delay: 60*60,
    // next_fetch: 450
    // start: 123123123212
    // results: {people_found: 43, images_found: 167}
    withTinder()
        .then(function(){
            return Tinder.tinder.withJob();
        })
        .then(function(job){
            var status = job.status();
            res.status(200).send(status);
        })
        .catch(Tinder.TinderRequiredError,function(err){
            log.error("[%s %s] - (%s) %s",req.method,req.url,err.name,err.message,{});
            res.status(401).send(err);
        })
        .catch(Job.JobRequiredError,function(err){
            log.error("[%s %s] - (%s) %s",req.method,req.url,err.name,err.message,{});
            res.status(404).send(err);
        })
        .catch(function(err){
            log.error("[%s %s] - %s",req.method,req.url,err.message,{});
            res.status(500).send(err.message);
        })
});

// Change Job
router.put("/job",function(req,res){
    // pause: [true|false]
    log.debug("[%s %s] - %j",req.method,req.url,req.body,{});
    withTinder()
        .then(function(){
            return Tinder.tinder.withJob();
        })
        .then(function(job){
            var promises = [];
            if (_.has(req.body,"pause")) {
                Tinder.tinder.pause(req.body.pause);
            }
            if (_.has(req.body,"profile")) {
                promises.push(Tinder.tinder.update(req.body.profile));
            }
            return Promise.all(promises);
        })
        .catch(Tinder.TinderRequiredError,function(err){
            log.error("[%s %s] - (%s) %s",req.method,req.url,err.name,err.message,{});
            res.status(401).send(err);
        })
        .catch(Job.JobRequiredError,function(err){
            log.error("[%s %s] - (%s) %s",req.method,req.url,err.name,err.message,{});
            res.status(404).send(err);
        })
        .catch(function(err){
            log.error("[%s %s] - %s",req.method,req.url,err.message,{});
            res.status(400).send(err.message);
        });
});


// Stop and delete Job
router.delete("/job",function(req,res){
    log.debug("[%s %s] - %j",req.method,req.url,req.body,{});
    withTinder()
        .then(function(){
            return Tinder.tinder.withJob();
        })
        .then(function(){
            return Tinder.tinder.stopJob();
        })
        .then(function(){
            log.info("[%s %s] - %s",req.method,req.url,"success",{});
            res.status(200).send("{}");
        })
        .catch(Tinder.TinderRequiredError,function(err){
            log.error("[%s %s] - (%s) %s",req.method,req.url,err.name,err.message,{});
            res.status(401).send(err);
        })
        .catch(Job.JobRequiredError,function(err){
            log.error("[%s %s] - (%s) %s",req.method,req.url,err.name,err.message,{});
            res.status(404).send(err);
        })
        .catch(function(err){
            log.error("[%s %s] - %s",req.method,req.url,err.message,{});
            res.status(500).send(err.message);
        });
});

module.exports = router;
