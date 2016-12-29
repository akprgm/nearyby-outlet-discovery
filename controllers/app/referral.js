var mongoose = require('mongoose');
var redis = require('redis');
var async = require('async');
var validator = require('../validator');
var utility = require('../utility');
var campaignModel = mongoose.model('campaign');
var referralModel = mongoose.model('referral');
module.exports = {
    refered : function refered(dataObject,response){
        if(validator.validateObjectId(dataObject.user_id) && typeof(dataObject.device_id)=='string' && typeof(dataObject.referral_code)=='string'){
            async.waterfall([
                function(referralCallback){
                    campaignModel.findOne({"referral_code":dataObject.referral_code},function(err,result){
                        if(err){
                            referralCallback(err);
                        }else if(result){
                            referralCallback(null,true);
                        }else{
                            referralCallback(null,false);
                        }
                    });
                },
                function(checkReferral,referralCallback){
                    if(checkReferral){
                        referralModel.findOne({"$and":[{"device_id":dataObject.device_id},{"referral_code":dataObject.referral_code}]}, function(err,result){
                            if(err){
                                referralCallback(err);
                            }else if(!err && result){
                                referralCallback(null,false);
                            }else{
                                let obj = {
                                    user_id: dataObject.user_id,
                                    device_id: dataObject.device_id,
                                    referral_code: dataObject.referral_code,
                                    date: (new Date).getTime()
                                }
                                let referral = new referralModel(obj);
                                referral.save(function(err,result){
                                    if(err){
                                        referralCallback(null,false);                                            
                                    }else if(!err && result){
                                        referralCallback(null,true);
                                    }
                                });
                            }
                        });
                    }else{
                        referralCallback(null);
                    }
                }
            ],function(err,result){
                if(err){
                    utility.internalServerError(response);
                }else if(!err && result){
                    utility.successRequest(response);
                }else{
                    utility.conflictRequest(response);
                }
            });
        }else{
            utility.badRequest(response);
        }
    }
}