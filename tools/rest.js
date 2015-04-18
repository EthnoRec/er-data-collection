#!/usr/bin/env node
var request = require("request");
var location = {};
location.milan = {lat: 45.465422, long: 9.185924};
location.guadalajara = {lat: 20.659699, long: -103.349609};
location.manchester = {lat: 53.480759, long: -2.242631};
location.busan = {lat: 35.166667, long:129.066667};
location.mumbai = {lat: 18.975, long: 72.825833};
location.belohorizonte = {lat: -19.916667, long: -43.933333};
location.monterrey = {lat: 25.666667, long:-100.3};

var host = "http://localhost:3000";

var yargs = require("yargs")
    .command("djob","Detection job")
    .command("tjob","Tinder job")
    .demand(1,"must provide a valid command")

    argv = yargs.argv;

var command = argv._[0];
if (command == "djob") {
    var cargv = yargs.reset()
        .usage("$0 djob [command]")
        .command("post","Post detection job")
        .demand(2,"must provide a valid command")
        .argv;
    var ccommand = cargv._[1];

    if (ccommand == "post") {
        var ccargv = yargs.reset()
            .usage("$0 djob post -n [no. of images]")
            .option("n",{
                describe: "Number of images to be processed in the job",
                demand: true
            })
            .option("L",{
                type:"string",
                describe:"Images from this location - ["+Object.keys(location).join("/")+"]",
                default: "all",
                alias: "location"
            })
            .argv;
        var body = { images: parseInt(ccargv.n) };
        if (ccargv.L != "all") {
            body.location = location[ccargv.L];
        }
        console.log(body);
        request
            .post(host+"/detection/job",{json:true,body:body},function(error,response,body){
                if (error) {
                    console.error(error);
                } else {
                    console.log(response.statusCode); 
                    console.log(body); 
                }
            });
    }
} else if (command == "tjob") {
    var cargv = yargs.reset()
        .usage("$0 tjob [command]")
        .command("post","Post Tinder job")
        .command("status","Status of the current Tinder job")
        .command("stop","Stop and delete the current Tinder job")
        .argv;
    var ccommand = cargv._[1];

    if (ccommand == "post") {
        var ccargv = yargs.reset()
            .usage("$0 tjob post -L [location]")
            .option("L",{
                type:"string",
                describe:"Images from this location - ["+Object.keys(location).join("/")+"]",
                demand: true,
                alias: "location"
            })
            .option("limit",{
                describe: "Maximum people to retrieve at once",
                default: 10
            })
            .option("delay",{
                describe: "Pause for the specified number of seconds between each fetch",
                default: 10
            })
            .help("h")
            .argv;

            var body = { location: location[ccargv.L], limit: ccargv.limit, retry_delay: ccargv.delay };
            request
                .post(host+"/job",{json:true,body:body},function(error,response,body){
                    console.log(response.statusCode); 
                    console.log(body); 
                });
    } else if (ccommand == "status") {
        var ccargv = yargs.reset()
            .usage("$0 tjob status")
            .help("h")
            .argv;
        request
            .get(host+"/job",{},function(error,response,body){
                console.log(response.statusCode); 
                console.log(body); 
            });
    } else if (ccommand == "stop") {
        var ccargv = yargs.reset()
            .usage("$0 tjob stop")
            .help("h")
            .argv;
        request
            .del(host+"/job",{},function(error,response,body){
                console.log(response.statusCode); 
                console.log(body); 
            });
    }
} else if (command == "config") {
    var ccargv = yargs.reset()
        .usage("$0 config -L [location]")
        .help("h")
        .option("L",{
            type:"string",
            describe:"Set location - ["+Object.keys(location).join("/")+"]",
            alias: "location"
        })
        .option("gender",{
            type:"string",
            describe:"Your gender [male|female]"
        })
        .option("gender-filter",{
            type:"string",
            describe:"Looking for [male|female]"
        })
        .option("distance-filter",{
            describe:"Scan distance filter"
        })
        .option("age-filter-min",{
            describe:"Minimum age"
        })
        .option("age-filter-max",{
            describe:"Maximum age"
        })
        .argv;
    var body = {};
    body.profile = {};
    var int = parseInt;
    if (ccargv.L) { body.location = ccargv.L; }
    if (ccargv.gender) { body.profile.gender = int(ccargv.gender); }
    if (ccargv["gender-filter"]) { body.profile.gender_filter = int(ccargv["gender-filter"]); }
    if (ccargv["distance-filter"]) { body.profile.distance_filter = int(ccargv["distance-filter"]); }
    if (ccargv["age-filter-min"]) { body.profile.age_filter_min = int(ccargv["age-filter-min"]); }
    if (ccargv["age-filter-max"]) { body.profile.age_filter_max = int(ccargv["age-filter-max"]); }
    if (Object.keys(ccargv).length > 1) {
        request
            .put(host+"/tinder",{json:true,body:body},function(error,response,body){
                console.log(response.statusCode); 
                console.log(body); 
            });
    }
} else {
    yargs.showHelp();
}



