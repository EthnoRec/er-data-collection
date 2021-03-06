var express = require("express");
var router = express.Router();

var _ = require("underscore");
var Promise = require("bluebird");
var log = require("app/logger");

var Tinder = require("app/Tinder").Tinder;
var Job = require("app/Tinder").Job;

var Person = require("app/models").Person;
var Image = require("app/models").Image;


router.get("/person/list",function(req,res){
    log.debug("[%s %s] - %j",req.method,req.url,req.body,{});
    Person.findAll({})
        .then(function(people){
            res.send(people);
        })
        .catch(function(err){
            log.error("[%s %s] - %s",req.method,req.url,err.message,{});
            res.status(500).send(err);
        });
});

router.get("/person/:_id",function(req,res){
    log.debug("[%s %s] - %j",req.method,req.url,req.body,{});
    Person.findOne({where:{_id:req.params._id}})
        .then(function(person){
            if (person) {
                res.send(person);
            } else {
                throw new Person.PersonNotFoundError(req.params._id);
            }
        })
        .catch(Person.PersonNotFoundError,function(err){
            log.error("[%s %s] - (%s) %s",req.method,req.url,err.name,err.message,{});
            res.status(404).send(err);
        })
        .catch(function(err){
            log.error("[%s %s] - %s",req.method,req.url,err.message,{});
            res.status(500).send(err);
        });
});

router.get("/image/:_id",function(req,res){
    log.debug("[%s %s] - %j",req.method,req.url,req.body,{});
    Image.find({where:{_id:req.params._id}})
    .then(function(img){
        if (img) {
            return img.showDetections({type:"basic"});
        } else {
            // TODO: create a proper error
            throw new Error("Image not found");
        }
    })
    .then(function(im){
        var buf = im.toBuffer();
        res.set("Content-Type", "image/jpeg");
        res.set("Content-Length", buf.length);
        res.send(buf);
    })
    .catch(function(err){
        log.error("[%s %s] - %s",req.method,req.url,err.message,{});
        res.status(404).send(err.message);
    });
});

module.exports = router;
