var tinder = require("tinderjs");
var request = require("request");
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
        this.settings = _.keep(defaults.user,fields);
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
        this.client.getRecommendations(config.tinder.max_results,
            function(err,data){
                _.each(data.results,Tinder.process);
            });
    });
};

Tinder.prototype.start = function() {
    this.fetch();
    setInterval(this.fetch,config.tinder.refresh_seconds*1000);
};

Tinder.processPerson = function(person) {
    console.log(person);
    _.each(person.photos,Tinder.processImage);
};

Tinder.processImage = function(image) {
    var uid = image.url.match(/.*gotinder.com\/(.*)\//);
    var filename = uid + "_" + image.fileName;
    request.get(image.url)
        .pipe(fs.createWriteStream(path.join(config.gather.image_dir,filename)));
};


module.exports = Tinder;
