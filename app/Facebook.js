var Promise = require("bluebird");
var request = Promise.promisify(require("request"));
var log = require("./logger");

var Facebook = function(token){
   this.token = token; 
   this.profile = null;
};

Facebook.prototype.getProfile = function(cb){
    var me = this;
    return request("https://graph.facebook.com/me?access_token="+this.token)
        .spread(function(response,body){
            // TODO: convert to an Error
            if (response.statusCode !== 200) {
                var err = JSON.parse(body).error;
                err.statusCode = response.statusCode;
                throw err;
            }
            me.profile = JSON.parse(body);
            return Promise.resolve(me.profile);
        });
};

module.exports = Facebook;
