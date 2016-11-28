var mongoose = require('mongoose');
var redis = require('redis');
var async = require('async');
var validator = require('../validator');
var utility = require('../utility');
var CheckInModel = mongoose.model('checkIn');
module.exports = {
    checkInOutlet: function checkIn(dataObject,response){
        if(validator.validateObjectId(dataObject.user_id) && validator.validateObjectId(dataObject.outlet_id) && validator.validateCategory(dataObject.category)){
            //finding whether the user actually is in shop locality or not
            /*  let outletLatitude = 28.515858;
                let outletLongitude = 77.177512;
                let distance = (6371*2*Math.asin(Math.sqrt(Math.pow(Math.sin((dataObject.latitude - outletLatitude)*Math.PI/180/2),2) + Math.cos(dataObject.latitude*Math.PI/180)*Math.cos(outletLatitude*Math.PI/180)*Math.pow(Math.sin((dataObject.longitude -outletLongitude)*Math.PI/180/2),2))));
                distance = Math.round(distance*1000);
                if(distance>10){
                }else{
                }
            */
            let checkInKey = dataObject.user_id+":checkIn";
            let user_id = mongoose.Types.ObjectId(dataObject.user_id);
            let offset = parseInt(dataObject.user_id);
            let obj = {
                user_id: dataObject.user_id,
                outlet_id: dataObject.outlet_id,
                public: true,
                date: (new Date).getTime(),
                category: dataObject.category
            }
            let checkIn = new CheckInModel(obj);
            checkIn.save(function(err,result){ 
                if(!err && result){
                    CheckInModel.aggregate([{"$lookup":{"from":"outlets","localField":"outlet_id","foreignField":"_id","as":"outlet_info"}},{"$match":{"user_id":user_id,"outlet_info":{"$ne":[]}}},{"$project":{"_id":0,"user_id":1,"date":1,"outlet_info._id":1,"outlet_info.name":1,"outlet_info.cover_image":1,"outlet_info.locality":1,"outlet_info.category":1}},{"$sort":{"date":-1}}],function(err,result){
                        if(!err && result.length>0){
                            utility.outletDefaultCoverImage(result);
                            utility.redisSaveKey(checkInKey,JSON.stringify(result));
                        }else{}
                    });
                    utility.successRequest(response);
                }else{
                    utility.internalServerError(response)
                }
            });
        }else{
            utility.badRequest(response);
        }
    },
    getUserCheckIns: function getCheckIns(dataObject,response){
        if(validator.validateObjectId(dataObject.user_id) && validator.validateOffset(dataObject.offset)){
            let checkInKey = dataObject.user_id+":checkIn";
            let user_id = mongoose.Types.ObjectId(dataObject.user_id);
            let offset = parseInt(dataObject.offset);            
            utility.redisFindKey(checkInKey,function(checkIns){
                if(checkIns = JSON.parse(checkIns)){//looking in redis cache store
                    utility.successDataRequest(checkIns.slice(offset,offset+10),response);//sending success response to client  
                }else{//looking in mongodbs
                    CheckInModel.aggregate([{"$lookup":{"from":"outlets","localField":"outlet_id","foreignField":"_id","as":"outlet_info"}},{"$match":{"user_id":user_id,"outlet_info":{"$ne":[]}}},{"$project":{"_id":0,"user_id":1,"date":1,"outlet_info._id":1,"outlet_info.name":1,"outlet_info.cover_image":1,"outlet_info.locality":1,"outlet_info.category":1}},{"$sort":{"date":-1}}],function(err,result){
                        if(!err && result.length > 0){
                            utility.outletDefaultCoverImage(result);
                            utility.redisSaveKey(checkInKey,JSON.stringify(result));
                            utility.successDataRequest(result.slice(offset,offset+10),response);//sending success response to client                              
                        }else{
                            utility.failureRequest(response);
                        }
                    });
                }
            });
        }else{
            utility.badRequest(response);
        }
    }
}