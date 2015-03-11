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

    fb.getProfile()
        .then(function(profile){
            log.debug("[GET /token/:token] - Received token for %s %s (id: %s)",
                profile.first_name, profile.last_name, profile.id);

            tinder = new Tinder(token,profile.id);
            res.sendStatus(200);
        })
        .catch(function(error){
            log.error("[GET /token/:token] - failed with status code %d",error.statusCode);
            res.status(error.statusCode).send(error.message);
        });
});

var withTinder = function(cb){
    if (!tinder) {
        var message = "Cannot perform this action or access this " +
             "resource without a valid token and Tinder instance";
        cb(new Error(message));
    } else {
        cb();
    }
};
var withTinderJob = function(){
    return withTinder(function(err){
        if (!err){
            return tinder.withJob();
        } else {
            throw err;
        }
    });
};

app.post("/job",function(req,res){
    // lat: 0.0, long: 0.0, limit: 10, retry_delay: 60*60
    log.debug("[%s %s] - %j",req.method,req.url,req.body,{});
    withTinder(function(err){
        if (err) {
            log.error("[%s %s] - %s",req.method,req.url,err.message,{});
            res.status(400).send(err.message);
        } else {
            tinder.submitJob(req.body);
            res.sendStatus(200);
        }
    });
});


withTinder = Promise.promisify(withTinder);
//withTinderJob = Promise.promisify(withTinderJob);
//Tinder.prototype.jobStatus = Promise.promisify(Tinder.prototype.jobStatus);
// Get Job status
app.get("/job",function(req,res){
    log.debug("[%s %s] - %j",req.method,req.url,req.body,{});
    // location: {lat: 0.0, long: 0.0},
    // limit: 10,
    // retry_delay: 60*60,
    // results: {people_found: 43, images_found: 167}
    withTinderJob()
        .then(function(status){
            res.status(200).send(status);
        })
        .catch(function(err){
            log.error("[%s %s] - %s",req.method,req.url,err.message,{});
            res.status(400).send(err.message);
        })
});

// Change Job
app.put("/job",function(req,res){
    // pause: [true|false]
    log.debug("[%s %s] - %j",req.method,req.url,req.body,{});
    withTinder(req,res,function(){
        if (_.has(req.body,"pause")) {
            tinder.pause(req.body.pause);
        }
    })
    .catch(function(err){
        log.error("[%s %s] - %s",req.method,req.url,err.message,{});
        res.status(400).send(err.message);
    })
});


// Stop and delete Job
app.delete("/job",function(req,res){
    log.debug("[%s %s] - %j",req.method,req.url,req.body,{});
    withTinder(req,res)
        .then(function(){
            return tinder.stopJob();
        })
        .then(function(){
            res.status(200);
        })
        .catch(function(err){
            res.status(404).send(err);
        });
    //withTinder(req,res,function(){
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
