var request = require("request");

var Facebook = function(token){
   this.token = token; 
   this.profile = null;
};

Facebook.prototype.getProfile = function(cb){
    var me = this;
    request("https://graph.facebook.com/me?access_token="+this.token,
            function(error,response,body){
                if (error || response.statusCode != 200) {
                    cb(error || response.statusCode, null);
                } else {
                    me.profile = JSON.parse(body);
                    cb(null,me.profile);
                }
            });
};

module.exports = Facebook;
