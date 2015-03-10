var tinder = require("tinderjs");
var request = require("request");
var fs = require("fs");
var path = require("path");
var _ = require("underscore");
var Promise = require("bluebird");

var log = require("./logger");

var config = require("./config");

var Sequelize = require("sequelize");
var Person = require("./models/Person");

Person.sync();


var Job = function(tinder,options) {
    // options = location.lat: 0.0, location.long: 0.0, limit: 10, retry_delay: 60*60
    log.debug("[Job#new]",options);
    this.tinder = tinder;

    this.online = false;
    this.people_found = 0;
    this.images_found = 0;

    _.extend(this,options);
};

Job.prototype.start = function() {
    log.debug("[Job#start]");
    // update position (updatePosition) and then do the following
    this.tinder.fetch();
    this.interval = setInterval(this.tinder.fetch,this.retry_delay*1000);
    this.online = true;
};

Job.prototype.stop = function() {
    log.debug("[Job#stop]");
    clearInterval(this.interval);
    this.online = false;
};

Job.prototype.status = function() {
    var status = _.pick(this,"location","limit","retry_delay","people_found","images_found","online");
    log.debug("[Job#status] - %j",status,{});
    //debugger;
    return status;
};

var Tinder = function(token,uid) {
    log.debug("[Tinder#new] - wait for auth");
    this.client = new tinder.TinderClient();
    this.token = token;
    this.uid = uid;

    this.authed(function(){
        var defaults = this.client.getDefaults();
        var fields = ["age_filter_min","age_filter_max",
        "birth_date","distance_filter","gender","gender_filter"];

        // Stored in memory. Will need to be served in views.
        this.settings = _.pick(defaults.user,fields);
        log.debug("[Tinder#new] - got defaults",this.settings);
    });
};

Tinder.prototype.authed = function(cb){
    var me = this;
    if (!this.client.isAuthorized()) {
        this.client.authorize(this.token,this.uid,function(){
            cb.call(me);
        });
    } else {
        cb.call(me);
    }
};

Tinder.prototype.fetch = function() {
    var me = this;
    var sum = function(a){return _.reduce(a,function(s,x){return s+x;},0);};

    if (this.job) {
        log.debug("[Tinder#fetch] - wait for auth");
        this.authed(function() {
            log.debug("[Tinder#fetch] - authorised");
            this.client.getRecommendations(this.job.limit,
                function(err,data){

                    Person.bulkCreateFromTinder(data.results,me.job.location)
                        .then(function(people) {
                            var images_fetched = 0;

                            _.each(data.results,function(person){
                                images_fetched += sum(_.map(person.photos,me.processImage,me));
                            });

                            me.job.images_found += images_fetched;
                            log.debug("[Tinder#fetch] - found %d people | %d new people and %d new images",
                                data.results.length,-1,images_fetched,{});
                        });
                });
        });
    } else {
        log.warn("[Tinder#fetch] - attempted to fetch without a job");
    }
};

Tinder.prototype.submitJob = function(job) {
    log.debug("[Tinder#submitJob]");
    this.job = new Job(this,job);
    this.job.start();
};

Tinder.prototype.pause = function(state,cb) {
    if (state && this.job) {
        this.job.start();
        log.debug("[Tinder#pause] - Job paused");
        cb(null,state);
    } else if (!state && this.job) {
        this.job.stop();
        log.debug("[Tinder#pause] - Job unpaused");
        cb(null,state);
    } else {
        log.warn("[Tinder#pause] - attempted to pause/unpause nonexisting Job");
    }
};

Tinder.prototype.stopJob = function(cb) {
    if (this.job) {
        this.job.stop();
        delete this.job;
        cb();
        log.debug("[Tinder#stopJob] - stopped and deleted");
    } else {
        var message = "attempted to stop nonexisting job";
        log.warn("[Tinder#stopJob] - %s",message);
        cb(message);
    }
};


Tinder.prototype.jobStatus = function(cb) {
    if (this.job) {
        cb(null,this.job.status());
    } else {
        var message = "cannot get status of nonexisting job";
        log.error("[Tinder#jobStatus] - %s",message);

        cb(message);
    }
};

//Tinder.prototype.processPerson = function(person) {
    //// save to database
    //// _id, distance_mi, name, gender, date_of_birth(to_unix)
    //var me = this;

    //Person.createFromTinder(person,this.job.location)
        //.success(function(){
            //me.people_found++;
            //_.each(person.photos,this.processImage,this);
        //})
        //.error(function(e){
            //if (e instanceof Sequelize.UniqueConstraintError) {
                //var _id = e.errors[0].value;
                //log.warn("[Tinder#processPerson] - ignoring familiar person %s",_id);
            //} else {
                //console.log(e);
                //log.error("[Tinder#processPerson] - %s | %j",e.name,e.errors,{})
            //}
        //});
//};

Tinder.prototype.processImage = function(image) {
    try {
        var uid = image.url.match(/.*gotinder.com\/(.*)\//)[1];
        var filename = uid + "_" + image.fileName;
        request.get(image.url)
            .pipe(fs.createWriteStream(path.join(process.cwd(),config.gather.image_dir,filename)));
        return 1;
    } catch(e) {
        log.error("[Tinder#processImage] - %s",e);
        return 0;
    }
};


Tinder.prototype = Promise.promisifyAll(Tinder.prototype);
module.exports = Tinder;
