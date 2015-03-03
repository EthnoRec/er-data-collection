var express = require("express");
var log = require("winston");

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
    // TODO: remove later
    console.log(token);
    fb = new Facebook(token);
    fb.getProfile(function(err,profile){
        if (err) {
            console.log(err);
            log.error("Could not get Facebook profile information");
        } else {
            log.info("Received token for %s %s (id: %s)",
                profile.first_name, profile.last_name, profile.id);

            tinder = new Tinder(token,profile.id);
        }
    });
    res.send("ok");
});

app.post("/job",function(req,res){
    // lat: 0.0, long: 0.0, limit: 10, retry_delay: 60*60
});

app.get("/job",function(req,res){
    // return status
});

app.put("/job",function(req,res){
    // pause: [true|false]
});

app.delete("/job",function(req,res){
    // stop and delete job
});

app.listen(3000,"localhost",function(){
        log.info("Started");
    })
    .on("error",function(e){
        log.error("Cannot start - " + e.code);
    });
