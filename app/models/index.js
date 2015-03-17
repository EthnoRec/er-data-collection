var Sequelize = require("sequelize");
var _ = require("underscore");
var config = require("../config");
var log = require("../logger");

var seq = new Sequelize(config.db.database, config.db.username, config.db.password, config.db);

var NoUniqueRecordsError = function(Model){
    this.name = "NoUniqueRecordsError";
    this.message = "No unique records found among those to be inserted in bulk";
    this.model = Model.name;
};
NoUniqueRecordsError.prototype = Object.create(Error.prototype, { 
      constructor: { value: NoUniqueRecordsError } 
});
var bulkIgnoreDuplicates = function(Model) {
    Model.beforeBulkCreate(function(records, fields) {
        var ids = _.pluck(records,"_id");
        var idlen = Model.rawAttributes._id.type.options.length;
        var padId = function(_id) {
            return _id + _.times(idlen-_id.length,function(){return " ";}).join("");
        };

        return Model.findAll({
            where: {_id: {in: ids}},
            attributes: ["_id"]})
            .then(function(instances){
               var existing = _.pluck(instances,"_id"); 

               _.each(existing,function(eid){
                   var ind = _.findIndex(records,function(r){
                        return padId(r._id) == eid;
                   });
                   if (ind > -1) {
                        records.splice(ind,1);
                   }
               });

               if (_.isEmpty(records)) {
                   throw new NoUniqueRecordsError(Model);
               } else {
                   return seq.Promise.resolve(records);
               }
            })
    });
}

module.exports.NoUniqueRecordsError = NoUniqueRecordsError;
module.exports.bulkIgnoreDuplicates = bulkIgnoreDuplicates;
module.exports.sequelize = seq;
