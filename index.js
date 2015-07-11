var express = require("express");
var exphbs  = require("express-handlebars");
var _ = require("underscore");
var Promise = require("bluebird");

var log = require("app/logger");
var Facebook = require("app/Facebook");
var Tinder = require("app/Tinder").Tinder;
var Job = require("app/Tinder").Job;

var app = express();

app.engine("handlebars", exphbs({defaultLayout: "main"}));
app.set("view engine", "handlebars");
app.use("/",express.static(__dirname + "/public"));
app.use(require("body-parser").json());


var sequelize = require("app/models").sequelize;
require("app/models/DetectionJob");
sequelize.sync();


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
app.use("",require("./app/routes/detection"));
app.use("",require("./app/routes/detection_job"));

app.put("/tinder",function(req,res){
    log.debug("[%s %s] - %j",req.method,req.url,req.body,{});
    // TODO: support more settings and add error checking
    Tinder.required().then(function(tinder){
        var promises = [];
        if (_.has(req.body,"profile")) {
            promises.push(Tinder.tinder.update(req.body.profile));
        }
        if (_.has(req.body,"location")) {
            promises.push(tinder.updatePosition(req.body.location));
        }
        return Promise.all(promises);
    })
    .then(function(d){
        log.debug("[%s %s] - %j",req.method,req.url,d,{});
        res.status(200).send("OK");
    })
    .catch(Tinder.TinderRequiredError,function(err){
        log.error("[%s %s] - (%s) %s",req.method,req.url,err.name,err.message,{});
        res.status(401).send(err);
    })
    .catch(function(err){
        log.error("[%s %s] - (%s) %s",req.method,req.url,err.name,err.message,{});
        res.status(500).send(err.message);
    });
});

app.listen(3000,"0.0.0.0",function(){
        log.info("[express] - Started");
    })
    .on("error",function(e){
        log.error("[express] - Cannot start - " + e.code);
    });
