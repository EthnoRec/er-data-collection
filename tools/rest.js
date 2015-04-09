var request = require("request");

var actions = {};

var action = process.argv[2];
var host = "http://localhost:3000";

var location = {};
location.milan = {lat: 45.465422, long: 9.185924};
location.guadalajara = {lat: 20.659699, long: -103.349609};
location.manchester = {lat: 53.480759, long: -2.242631};

actions.job_post = function() {

    var body = { location: location.guadalajara, limit: 10, retry_delay: 60 };
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
actions.tinder_put = function() {
    var body = {location:location.guadalajara};
    request
        .put(host+"/tinder",{json:true,body:body},function(error,response,body){
            console.log(response.statusCode); 
            console.log(body); 
        });
};
actions.djob_post = function() {
    var body = { images: 5 };
    request
        .post(host+"/detection/job",{json:true,body:body},function(error,response,body){
            console.log(response.statusCode); 
            console.log(body); 
        });
};
actions[action]();
