var expect = require("chai").expect;
var path = require("path");
var _ = require("underscore");

var Person = require(path.join(process.cwd(),"./app/models/Person"));
var Image = require(path.join(process.cwd(),"./app/models/Image"));

debugger;
describe("Model",function(){
    describe("Person",function(){
        describe("::processImages",function(){
            it("should be able to insert and download images from Tinder profiles",function(done) {
                expect(Person).to.have.property("processImages");

                Image.sync({force:true})
                .then(function(){
                    Image.imageFromTinder = function(img) {
                        return img;    
                    };
                    Image.instanceDownload = function() {
                        return this.ext != "err";
                    };
                    var people = [
                        { photos: [
                            {_id: "error1", ext:"err" },
                            {_id: "error2", ext:"err" },
                            {_id: "good1" },
                            {_id: "good2" }
                        ]}
                    ];
                    Person.processImages(people).then(function(){
                        Image.findAll().then(function(images){
                            expect(images).to.have.length(2);
                            _.each(images,function(image){
                                expect(image.ext).to.be.null;
                            });
                            done();
                        });
                    });
                });
            });
        });
        it("should be able to connect to database",function(done){
            Person.sync({force:true}).then(function(){
                done();
            });
        });
        it("should be able to insert Person instances from Tinder profiles (no photos)",function(done){
            Person.sync({force:true}).then(function(){
                expect(Person).to.have.property("bulkCreateFromTinder");
                expect(Person.bulkCreateFromTinder).to.be.a("function");


                var p = {
                    _id: "52a0fbefb0e9e17558000036",
                    distance_mi: 12,
                    name: "Tester",
                    gender: 1,
                    date_of_birth: "1994-01-11T00:00:00.000Z",
                    photos: []
                };
                var location = {
                    lat: 52.123,
                    long: 2.332
                };

                Person.bulkCreateFromTinder([p],location)
                    .then(function(){
                        done();
                    });

            });
        });
    });
});
