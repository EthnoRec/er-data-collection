var expect = require("chai").expect;
var path = require("path");
var _ = require("underscore");

var Person = require(path.join(process.cwd(),"./app/models/Person"));

describe("Model",function(){
    describe("Person",function(){
        it("should be able to connect to SQLite3",function(done){
            Person.sync({force:true}).then(function(){
                done();
            });
        });
        it("should be able to create itself from a Tinder profile",function(done){
            Person.sync({force:true}).then(function(){
                expect(Person).to.have.property("createFromTinder");
                expect(Person.createFromTinder).to.be.a("function");

                var p = {
                    _id: "52a0fbefb0e9e17558000036",
                    distance_mi: 12,
                    name: "Tester",
                    gender: 1,
                    date_of_birth: "1994-01-11T00:00:00.000Z"
                };
                var location = {
                    lat: 52.123,
                    long: 2.332
                };

                Person.createFromTinder(p,location);

                done();
            });
        });
    });
});
