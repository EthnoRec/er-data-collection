var request = require("request");

var actions = {};

var action = process.argv[2];
var host = "http://localhost:3000";

actions.job_post = function() {
    var body = { location: {lat: 0.0, long: 0.0}, limit: 10, retry_delay: 60*60 };
    request
        .post(host+"/job",{json:true,body:body},function(error,response,body){
            console.log(response.statusCode); 
            console.log(body); 
        });
};

actions.job_get = function() {
    request
        .get(host+"/job",{},function(error,response,body){
            console.log(response.statusCode); 
            console.log(body); 
        });
};

actions.job_delete = function() {
    request
        .del(host+"/job",{},function(error,response,body){
            console.log(response.statusCode); 
            console.log(body); 
        });
};
actions[action]();
