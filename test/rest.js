var expect = require("chai").expect;
var request = require("request");


var host = "http://localhost:3000";

describe("Rest",function(){
    describe("Job",function(){
        describe("GET /job",function(){
            it("should return a JobRequiredError with HTTP code 404",function(done){
                request
                    .get(host+"/job",{},function(error,response,body){
                        expect(response).to.have.property("statusCode");
                        expect(response.statusCode).to.equal(404);

                        var error = JSON.parse(body);

                        expect(error).to.have.property("name");
                        expect(error.name).to.equal("JobRequiredError");

                        done();
                    });
            });
        });
    });
});
