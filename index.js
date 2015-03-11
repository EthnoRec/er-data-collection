var express = require("express");
var _ = require("underscore");
var Promise = require("bluebird");

var log = require("./app/logger");
var Facebook = require("./app/Facebook");
var Tinder = require("./app/Tinder").Tinder;
var Job = require("./app/Tinder").Job;

var app = express();

app.use("/",express.static(__dirname + "/public"));
app.use(require("body-parser").json());


// Global variables
var fb = null;

// Routes
app.get("/token/:token",function(req,res){
    var token = req.params.token;
    fb = new Facebook(token);
    log.debug("[GET /token/:token] - waiting for Facebook#getProfile ...");

    fb.getProfile()
        .then(function(profile){
            log.debug("[GET /token/:token] - Received token for %s %s (id: %s)",
                profile.first_name, profile.last_name, profile.id);

            Tinder.tinder = new Tinder(token,profile.id);
            res.sendStatus(200);
        })
        .catch(function(error){
            log.error("[GET /token/:token] - failed with status code %d",error.statusCode);
            res.status(error.statusCode).send(error.message);
        });
});

app.use("",require("./app/routes/job"));
app.use("",require("./app/routes/person"));

app.listen(3000,"localhost",function(){
        log.info("[express] - Started");
    })
    .on("error",function(e){
        log.error("[express] - Cannot start - " + e.code);
    });
