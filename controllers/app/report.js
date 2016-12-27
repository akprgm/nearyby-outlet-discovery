var mongoose = require('mongoose');
var redis = require('redis');
var async = require('async');
var validator = require('../validator');
var utility = require('../utility');
var reportShutdonwModel = mongoose.model('shutdownReport');
var reportErrorModel = mongoose.model('errorReport');
module.exports = {
    reportShutdown : function reportShutdown(dataObject,response){
        if(validator.validateObjectId(dataObject.user_id) && validator.validateObjectId(dataObject.outlet_id) && validator.validateCategory(dataObject.category)){
            reportShutdonwModel.find({"$and":[{"user_id":dataObject.user_id},{"outlet_id":dataObject.outlet_id}]},{},function(err,result){
                if(err){
                    utility.internalServerError(response);
                }else if(!err && result.length){
                    utility.successRequest(response);
                }else{
                    console.log("asdkfjsadklf");
                    let obj = {
                        user_id: dataObject.user_id,
                        outlet_id: dataObject.outlet_id,
                        category: dataObject.category,
                        date: (new Date).getTime()
                    }
                    let report = new reportShutdonwModel(obj);
                    report.save(function(err,result){
                        if(err){
                            utility.internalServerError(response);
                        }else if(!err && result){
                            utility.successRequest(response);
                        }
                    });
                }
            });
        }else{
            utility.badRequest(response);
        }
    },
    reportError : function reportError(dataObject,response){
        if(validator.validateObjectId(dataObject.user_id) && validator.validateObjectId(dataObject.outlet_id) && validator.validateCategory(dataObject.category)){
            reportErrorModel.find({"$and":[{"user_id":dataObject.user_id},{"outlet_id":dataObject.outlet_id}]},{},function(err,result){
                if(err){
                    utility.internalServerError(response);
                }else if(!err && result.length){
                    utility.successRequest(response);
                }else{
                    let obj = {
                        user_id: dataObject.user_id,
                        outlet_id: dataObject.outlet_id,
                        category: dataObject.category,
                        date: (new Date).getTime(),
                        header: (dataObject.header)?true:false,
                        about: (dataObject.about)?true:false,
                        stm: (dataObject.stm)?true:false,
                        timing: (dataObject.timing)?true:false,
                        labels: (dataObject.labels)?true:false,
                        reviews: (dataObject.reviews)?true:false,
                        tags: (dataObject.tags)?true:false,
                        msg: (dataObject.msg)?dataObject.msg:'',
                    }
                    let report = new reportErrorModel(obj);
                    report.save(function(err,result){
                        if(err){
                            utility.internalServerError(response);
                        }else if(!err && result){
                            utility.successRequest(response);
                        }
                    });
                }
            });
        }else{
            utility.badRequest(response);
        }
    }
}