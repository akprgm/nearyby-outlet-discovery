var mongoose = require('mongoose');
var redis = require('redis');
var async = require('async');
var validator = require('../validator');
var utility = require('../utility');
var campaignModel = mongoose.model('campaign');
var referralModel = mongoose.model('referral');
module.exports = {
    referred : function referred(dataObject,response){
        if(validator.validateObjectId(dataObject.user_id) && typeof(dataObject.device_id)=='string' && typeof(dataObject.referral_code)=='string'){
            async.waterfall([
                function(referralCallback){
                    campaignModel.findOne({"referral_code":dataObject.referral_code},function(err,result){
                        if(err){
                            referralCallback(err);
                        }else if(result){
                            referralCallback(null,result);
                        }else{
                            referralCallback(null,result);
                        }
                    });
                },
                function(checkReferral,referralCallback){
                    if(checkReferral){
                        referralModel.findOne({"$and":[{"device_id":dataObject.device_id},{"referral_code":dataObject.referral_code}]}, function(err,result){
                            if(err){
                                referralCallback(err);
                            }else if(!err && result){
                                referralCallback(null,1);
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
                                        referralCallback(err);                                            
                                    }else if(!err && result){
                                        referralCallback(null,2);
                                    }
                                });
                            }
                        });
                    }else{
                        referralCallback(null,3);
                    }
                }
            ],function(err,result){
                if(err){
                    utility.internalServerError(response);
                }else if(!err && result){
                    let obj ={ "status":true}
                    if(result == 1){
                        obj.message = "Referral code already redeemed";
                    }else if(result == 2){
                        obj.message = "Referral code successfully redeemed";
                    }else{
                        obj.message = "This referral code no longer valid";
                    }
                    response.send(obj);
                }
            });
        }else{
            utility.badRequest(response);
        }
    }
}