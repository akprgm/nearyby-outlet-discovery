var mongoose = require('mongoose');
var redis = require('redis');
var async = require('async');
var request = require('request');
var env = require('../../env/development');
var models = require('../../models/appModel');
var validator = require('../validator');
var utility = require('../utility');
var OutletModel = models.outlet;
var Outlet = new OutletModel;
module.exports = {
    searchString: function(dataObject, response){
        if(validator.validateLatitudeLongitude(parseFloat(dataObject.latitude)),parseFloat(dataObject.longitude) && typeof(parseFloat(dataObject.minDistance))=='number' && typeof(dataObject.search_string) == 'string'){
            let location = [parseFloat(dataObject.longitude),parseFloat(dataObject.latitude)];
            let minDistance = parseFloat(dataObject.minDistance)*1000+1;
            Outlet.aggregate([{"$match":{"$text":{"$search":dataObject.search_string}}},{"$project":{"locality":1,"cover_image":1,"name":1,"location":1,"contacts":1}},{"$sort":{"score":{"$meta":"textScore"}}},{"$limit":10}],function(err,results){
                if(err){
                    utility.internalServerError(response);
                }else{
                    utility.successDataRequest(results,response);                
                }
            });
        }else{
            utility.badRequest(response);
        }
    },
    filterSearch: function(){
    }
}