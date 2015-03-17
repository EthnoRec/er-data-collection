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

var Job = function(tinder,options) {
    // options = location.lat: 0.0, location.long: 0.0, limit: 10, retry_delay: 60*60
    log.debug("[Job#new]",options);
    this.tinder = tinder;

    this.online = false;
    this.people_found = 0;
    this.images_found = 0;

    _.extend(this,options);
};

Job.JobRequiredError = function(){
    this.name = "JobRequiredError";
    this.message = "A job is required for this action";
};
Job.JobRequiredError.prototype = Object.create(Error.prototype, { 
      constructor: { value: Job.JobRequiredError } 
});
Job.prototype.start = function() {
    var me = this;
    log.debug("[Job#start]");
    var _start = function(location){
        me.tinder.fetch();
        me.interval = setInterval((function(me){ 
            return function(){
                me.fetch();
            };
        })(me.tinder),me.retry_delay*1000);

        me.started = me.interval.started = Date.now();
        me.interval.getTimeLeft = function() {
            return Math.round((this._idleTimeout - (Date.now()-this.started) % this._idleTimeout) / 1000);
        };
        me.online = true;
        return me;
    };
    if (this.location) {
        return this.tinder.updatePosition(this.location).then(_start)
        .catch(Tinder.SmallChangeError,function(err){
            log.warn("[Job#start] - location change request ignored (%s)",err.name);
            _start();
            return Promise.resolve(me);
        })
    } else {
        return Promise.resolve(me);    
    }
};

Job.prototype.stop = function() {
    log.debug("[Job#stop]");
    clearInterval(this.interval);
    this.online = false;
};

Job.prototype.status = function() {
    var status = _.pick(this,"location","limit","retry_delay","people_found","images_found","online","started");
    status.next_fetch = this.interval.getTimeLeft();
    log.debug("[Job#status] - %j",status,{});
    return status;
};

Job.required = Promise.promisify(function(cb){
    if (!Job.job) {
        cb(new Job.JobRequiredError());
    } else {
        cb(null,Job.job);
    }
});

var Tinder = function(token,uid) {
    var promisified = function(client){
        client.getRecommendations = Promise.promisify(client.getRecommendations);
        client.updatePosition = Promise.promisify(client.updatePosition);
        return client; 
    };

    log.debug("[Tinder#new] - wait for auth");
    this.client = promisified(new tinder.TinderClient());
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

Tinder.prototype.authed = Promise.promisify(function(cb){
    var me = this;
    if (!this.client.isAuthorized()) {
        this.client.authorize(this.token,this.uid,function(){
            cb.call(me);
        });
    } else {
        cb.call(me);
    }
});


Tinder.prototype.updatePosition = function(location) {
    var me = this;
    return this.client.updatePosition(location.long,location.lat)
        .then(function(response){
            if (response.error){
                if (response.error === "major position change not significant"){
                    throw new Tinder.MajorChangeError();
                } else if (response.error === "position change not significant") {
                    throw new Tinder.SmallChangeError();
                } else {
                    throw new Error("Unknown Tinder error");
                }
            } else {
                me.location = location;
                return location;
            }
        });
};


Tinder.prototype.withJob = function(){
    if (this.job){
        log.debug("[Tinder#withJob] - job exists");
        return Promise.resolve(this.job);
    } else {
        log.debug("[Tinder#withJob] - job does not exist");
        throw new Job.JobRequiredError();
    }
};

Tinder.prototype.fetch = function(me) {
    var me = me || this;
    var sum = function(a){return _.reduce(a,function(s,x){return s+x;},0);};

    log.debug("[Tinder#fetch] - wait for auth");
    return me.authed().then(me.withJob())
    .then(function(){
        log.debug("[Tinder#fetch] - authorised");
        var p = me.client.getRecommendations(me.job.limit);
        return p;
    })
    .then(function(data){
        if (data.message) {
            if (data.message === "recs timeout") {
                throw new Tinder.RecsTimeoutError();
            }
        }
        return Person.bulkCreateFromTinder(data.results,me.job.location);
    })
    .then(function(people){
        log.debug("[Tinder#fetch] - found %d people | %d new people and %d new images",
            people.length,-1,-1,{});

    });
};

Tinder.prototype.submitJob = function(job) {
    log.debug("[Tinder#submitJob]");
    Job.job = this.job = new Job(this,job);
    return this.job.start();
};

Tinder.prototype.pause = function(state,cb) {
    // TODO: pause the actual timer
    if (state && this.job) {
        this.job.stop();
        log.debug("[Tinder#pause] - Job paused");
        cb(null,state);
    } else if (!state && this.job) {
        this.job.start();
        log.debug("[Tinder#pause] - Job unpaused");
        cb(null,state);
    } else {
        log.warn("[Tinder#pause] - attempted to pause/unpause nonexisting Job");
    }
};

Tinder.prototype.stopJob = Promise.promisify(function(cb) {
    if (this.job) {
        this.job.stop();
        delete this.job;
        log.debug("[Tinder#stopJob] - stopped and deleted");
        cb();
    } else {
        var message = "attempted to stop nonexisting job";
        log.warn("[Tinder#stopJob] - %s",message);
        cb(message);
    }
});


Tinder.prototype.jobStatus = function() {
    return this.withJob()
        .then(Promise.resolve(this.job.status()));
};



Tinder.TinderRequiredError = function(){
    this.name = "TinderRequiredError";
    this.message = "Cannot perform this action or access this " +
             "resource without a valid token and Tinder instance";
};
Tinder.TinderRequiredError.prototype = Object.create(Error.prototype, { 
      constructor: { value: Tinder.TinderRequiredError } 
});

Tinder.RecsTimeoutError = function(){
    this.name = "RecsTimeoutError";
    this.message = "Did not find nearby users quick enough";
};
Tinder.RecsTimeoutError.prototype = Object.create(Error.prototype, { 
      constructor: { value: Tinder.RecsTimeoutError } 
});
Tinder.MajorChangeError = function(){
    this.name = "MajorChangeError";
    this.message = "Major position change (changing positions too far too quickly)";
};
Tinder.MajorChangeError.prototype = Object.create(Error.prototype, { 
      constructor: { value: Tinder.MajorChangeError } 
});
Tinder.SmallChangeError = function(){
    this.name = "SmallChangeError";
    this.message = "Minor position change (new position is not far enough to warrant a change)";
};
Tinder.SmallChangeError.prototype = Object.create(Error.prototype, { 
      constructor: { value: Tinder.SmallChangeError } 
});

Tinder.required = Promise.promisify(function(cb){
    if (!Tinder.tinder) {
        cb(new Tinder.TinderRequiredError());
    } else {
        cb(null,Tinder.tinder);
    }
});

module.exports.Tinder = Tinder;
module.exports.Job = Job;
