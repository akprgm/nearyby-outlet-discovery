var mongoose = require('mongoose');
var redis = require('redis');
var models = require('../../models/appModel');
var validator = require('../validator');
var utility = require('../utility');
var CheckInModel = models.checkIn;
var CheckIn = new CheckInModel();
module.exports = {
    checkInOutlet: function checkIn(dataObject,response){
        if(validator.validateObjectId(dataObject.user_id) && validator.validateObjectId(dataObject.outlet_id) && validator.validateCategory(dataObject.category) && validator.validateLatitudeLongitude(dataObject.latitude, dataObject.longitude)){
            //finding whether the user actually is in shop locality or not
            /*  let outletLatitude = 28.515858;
                let outletLongitude = 77.177512;
                let distance = (6371*2*Math.asin(Math.sqrt(Math.pow(Math.sin((dataObject.latitude - outletLatitude)*Math.PI/180/2),2) + Math.cos(dataObject.latitude*Math.PI/180)*Math.cos(outletLatitude*Math.PI/180)*Math.pow(Math.sin((dataObject.longitude -outletLongitude)*Math.PI/180/2),2))));
                distance = Math.round(distance*1000);
                if(distance>10){
                }else{
                }
            */
            var checkInKey = dataObject.user_id+":checkIn";
            let obj = {
                user_id: dataObject.user_id,
                outlet_id: dataObject.outlet_id,
                public: true,
                date: (new Date).getTime(),
                category: dataObject.category
            }
            let checkIn = new CheckIn(obj);
            checkIn.save(function(err,result){ 
                if(!err && result){
                    CheckIn.find({user_id:dataObject.user_id},function(err,result){
                        if(!err && result){
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
    getCheckIns: function getCheckIns(dataObject,response){
       if(validator.validateObjectId(dataObject.user_id)){
            var checkInKey = dataObject.user_id+":checkIn";
            utility.redisFindKey(checkInKey,function(checkIns){
                if(checkIns = JSON.parse(checkIns)){//looking in redis cache store
                    utility.successDataRequest(checkIns,response);//sending success response to client  
                }else{//looking in mongodbs
                    CheckIn.find({user_id:dataObject.user_id},function(err,result){
                        if(!err && result.length > 0){
                            utility.redisSaveKey(checkInKey,JSON.stringify(result));
                            utility.successDataRequest(result,response);//sending success response to client                              
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