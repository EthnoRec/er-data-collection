var express = require("express");
var _ = require("underscore");
var Promise = require("bluebird");

var log = require("./app/logger");
var Facebook = require("./app/Facebook");
var Tinder = require("./app/Tinder");

var app = express();

app.use("/",express.static(__dirname + "/public"));
app.use(require("body-parser").json());


// Global variables
var fb = null;
var tinder = null;

// Routes
app.get("/token/:token",function(req,res){
    var token = req.params.token;
    fb = new Facebook(token);
    log.debug("[GET /token/:token] - waiting for Facebook#getProfile ...");
    fb.getProfile(function(err,code,profile){
        if (err || code !== 200) {
            log.error("[GET /token/:token] - failed with status code %d",code);
            res.status(code).send(err.message);
        } else {
            log.debug("[GET /token/:token] - Received token for %s %s (id: %s)",
                profile.first_name, profile.last_name, profile.id);

            tinder = new Tinder(token,profile.id);
            res.sendStatus(200);
        }
    });
});

var requireTinder = function(req,res,cb){
    if (!tinder) {
        var message = "Cannot perform this action or access this " +
             "resource without a valid token and Tinder instance";
        log.error("[%s %s] - %s",req.method,req.url,message);
        res.status(401).send(message);
    } else {
        cb();
    }
};

app.post("/job",function(req,res){
    // lat: 0.0, long: 0.0, limit: 10, retry_delay: 60*60
    log.debug("[%s %s] - %j",req.method,req.url,req.body,{});
    requireTinder(req,res,function(){
        tinder.submitJob(req.body);
        res.sendStatus(200);
    });
});


requireTinder = Promise.promisify(requireTinder);
// Get Job status
app.get("/job",function(req,res){
    log.debug("[%s %s] - %j",req.method,req.url,req.body,{});
    // location: {lat: 0.0, long: 0.0},
    // limit: 10,
    // retry_delay: 60*60,
    // results: {people_found: 43, images_found: 167}
    requireTinder(req,res)
        .then(function(){
            return tinder.jobStatus();
        })
        .then(function(status){
            res.status(200).send(status);
        })
        .catch(function(err){
            res.status(404).send(err);
        });
});

// Change Job
app.put("/job",function(req,res){
    // pause: [true|false]
    log.debug("[%s %s] - %j",req.method,req.url,req.body,{});
    requireTinder(req,res,function(){
        if (_.has(req.body,"pause")) {
            tinder.pause(req.body.pause);
        }
    });
});


// Stop and delete Job
app.delete("/job",function(req,res){
    log.debug("[%s %s] - %j",req.method,req.url,req.body,{});
    requireTinder(req,res)
        .then(function(){
            return tinder.stopJob();
        })
        .then(function(){
            res.status(200);
        })
        .catch(function(err){
            res.status(404).send(err);
        });
    //requireTinder(req,res,function(){
        //tinder.stopJob(function(err){
            //if (err) {
                //res.status(404).send(err);
            //} else {
                //res.status(200);
            //}   
        //});
    //});
});

app.listen(3000,"localhost",function(){
        log.info("[express] - Started");
    })
    .on("error",function(e){
        log.error("[express] - Cannot start - " + e.code);
    });
