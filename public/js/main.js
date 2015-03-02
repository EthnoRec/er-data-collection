var config = {
    extension: "oekgffokigknnlamdlicemedjeogpoob"
};
var request = function(req,cb) {
    chrome.runtime.sendMessage(config.extension, req, cb);
};
var signIn = function() {
    request({type:"openFacebookAuthTab"},function(response){
        alert(response.token);  
    });
};


$(document).ready(function(){
    $("#signin").click(function(){
        signIn();
    });
});
