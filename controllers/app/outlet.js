var mongoose = require('mongoose');
var async = require('async');
var request = require('request');
var env = require('../../env/development');
var utility = require('../utility');
var validator = require('../validator');
var models = require('../../models/appModel');
var OutletModel = models.outlet;
var Outlet = new OutletModel();
module.exports = {
    outletDetails: function outletDetails(dataObject, response){
        if(validator.validateObjectId(dataObject.outlet_id)){
            utility.redisFindKey(dataObject.outlet_id,function(outlet){
                if(outlet = JSON.parse(outlet)){
                    utility.successDataRequest(outlet,response);
                }else{
                    async.waterfall([
                        function(callback){//finding the outlet Deatils
                            let outlet_id = mongoose.Types.ObjectId(dataObject.outlet_id);
                            Outlet.find({"_id":outlet_id,"status":true},function(err,outlet){
                                if(!err && outlet.length>0){
                                    callback(null,outlet[0]);
                                }else{
                                    utility.badRequest(response);
                                }
                            });         
                        },
                        function(outlet,callback){
                            var obj = {
                                name: outlet.name,
                                cover_image: outlet.cover_image,
                                address: outlet.address,
                                star: outlet.star,
                                rating: outlet.rating,
                                about: outlet.about,                        
                                location: outlet.location,
                                contacts: outlet.contacts,
                                discount: outlet.discount,
                                timings: outlet.timings,
                                tags: outlet.tags,
                                labels: outlet.labels
                            }
                            switch(outlet.category){
                                case 'book':
                                        obj.stm = {
                                            cost_rating: outlet.cost_rate,
                                            exchange_policy: outlet.labels.exchange_policy,
                                            exchange_days: outlet.labels.exchange_days,
                                            return_policy: outlet.labels.return_policy,
                                            return_days: outlet.labels.return_days,
                                            second_hand_book: outlet.labels.second_hand_book,
                                            outlet_accept: outlet.outlet_accept
                                        }
                                    break;
                                case 'cloth':
                                        obj.stm = {
                                            cost_rating: outlet.cost_rate,
                                            gender: outlet.gender,
                                            outlet_type: outlet.outlet_type,
                                            outlet_accept: outlet.outlet_accept
                                        } 
                                    break;
                                case 'consumer':
                                        obj.stm = {
                                            cost_rating: outlet.cost_rate,
                                            exchange_policy: outlet.labels.exchange_policy,
                                            exchange_days: outlet.labels.exchange_days,
                                            return_policy: outlet.labels.return_policy,
                                            return_days: outlet.labels.return_days,
                                            outlet_accept: outlet.outlet_accept,
                                            EMI: outlet.labels.EMI,
                                            buy_back: outlet.labels.buy_back,
                                            repair_service: outlet.labels.repair_service
                                        }
                                    break;
                                case 'watch':
                                        obj.stm = {
                                            cost_rating: outlet.cost_rate,
                                            outlet_accept: outlet.outlet_accept,
                                            repair_service: outlet.labels.repair_service
                                        }
                                    break;
                                default:
                            }

                            //getting outle review and images 
                            async.parallel([
                                function(callback2){
                                    let outletReviewUrl = env.app.url+"getOutletReviews?access_token="+dataObject.access_token+"&outlet_id="+dataObject.outlet_id;
                                    request(outletReviewUrl,function(err,res,body){
                                        if(!err && res.statusCode==200){
                                            let data = JSON.parse(body);
                                            obj.reviews = (data.message).slice(0,2);    
                                        }else{
                                            obj.reviews = new Array();
                                        }
                                        callback2();                            
                                    });
                                },
                                function(callback2){
                                let outletImageUrl = env.app.url+"getOutletImages?access_token="+dataObject.access_token+"&outlet_id="+dataObject.outlet_id;
                                    request(outletImageUrl,function(err,res,body){
                                        if(!err && res.statusCode==200){
                                            let data = JSON.parse(body);
                                            obj.images = data.message;
                                        }else{
                                            obj.images = new Array();
                                        }
                                        callback2();                            
                                    });
                                }
                            ],function(err, result){
                                callback(null,obj);                                            
                            });
                        }
                    ],function(err,result){
                        if(!err && validator.validateEmptyObject(result)){
                            utility.redisSaveKey(dataObject.outlet_id,JSON.stringify(result));        
                            utility.successDataRequest(result,response);
                        }else{
                            utility.internalServerError(response);
                        }
                    });
                }
            });
        }else{
            utility.badRequest(response);
        }     
    },
    outletBasicInfo: function outletBasicInfo(dataObject, response){
    }
}
