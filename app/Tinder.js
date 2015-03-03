var tinder = require("tinderjs");
var request = require("request");
var fs = require("fs");
var path = require("path");
var _ = require("underscore");

var config = require("./config");

var Tinder = function(token,uid) {
    this.client = new tinder.TinderClient();
    this.token = token;
    this.uid = uid;

    this.authed(function(){
        var defaults = this.client.getDefaults();
        var fields = ["age_filter_min","age_filter_max",
        "birth_date","distance_filter","gender","gender_filter"];

        // Stored in memory. Will need to be served in views.
        this.settings = _.pick(defaults.user,fields);
    });
};

Tinder.prototype.authed = function(cb){
    var me = this;
    if (!this.client.isAuthorized()) {
        this.client.authorize(this.token,this.uid,function(){
            cb.call(me);
        });
    }
};

Tinder.prototype.fetch = function() {
    this.authed(function() {
        this.client.getRecommendations(this.fetch_limit,
            function(err,data){
                _.each(data.results,Tinder.processPerson);
            });
    });
};

Tinder.prototype.start = function(job) {
    // job = lat: 0.0, long: 0.0, limit: 10, retry_delay: 60*60
    this.fetch();
    this.fetch_limit = job.limit;
    // update position (updatePosition) and then do the following
    setInterval(this.fetch,job.retry_delay*1000);
};

Tinder.processPerson = function(person) {
    console.log(person);
    // save to SQLite3
    // _id, distance_mi, name, gender, date_of_birth(to_unix)
    _.each(person.photos,Tinder.processImage);
};

Tinder.processImage = function(image) {
    var uid = image.url.match(/.*gotinder.com\/(.*)\//)[1];
    var filename = uid + "_" + image.fileName;
    request.get(image.url)
        .pipe(fs.createWriteStream(path.join(process.cwd(),config.gather.image_dir,filename)));
};


module.exports = Tinder;
