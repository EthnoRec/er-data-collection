var Promise = require("bluebird");
var request = Promise.promisify(require("request"));
var log = require("./logger");

var Facebook = function(token){
   this.token = token; 
   this.profile = null;
};

Facebook.prototype.getProfile = function(cb){
    var me = this;
    request("https://graph.facebook.com/me?access_token="+this.token)
        .spread(function(response,body){
            if (response.statusCode !== 200) {
                throw JSON.parse(body).error;
            }
            console.log(response.statusCode);
        })
        .catch(function(error){
            log.error("[Facebook#getProfile] -",error);
        });

            //function(error,response,body){
                ////console.log(response);
                //if (error || response.statusCode !== 200) {
                    //error = JSON.parse(body).error;
                    //log.error("[Facebook#getProfile] - (%d)",response.statusCode,error);
                    //cb(error,response.statusCode, null);
                //} else {
                    //me.profile = JSON.parse(body);
                    //cb(null,response.statusCode,me.profile);
                //}
            //});
};

module.exports = Facebook;
