var mongoose = require('mongoose');
var redis = require('redis');
var async = require('async');
//var request = require('request');
var models = require('../../models/appModel');
var validator = require('../validator');
var utility = require('../utility');
var env = require('../../env/development.js');
var UserModel = models.user;
var USER = {
    findIndex: function findIndex(arr,value,start,last,mstart,mlast){
        if(mstart>=mlast/2){
            return null;
        }
        let mid = parseInt((start + last)/2);
        if(arr[mid].totalPoints > value.userActivities){
            return findIndex(arr, value, mid, last, mstart++, mlast);
        }else if(arr[mid].totalPoints < value.userActivities){
            return findIndex(arr, value, start, mid, mstart++, mlast);
        }else{
            return mid;
        }
    },
    findMatch: function findMatch(arr,index,user){
        let found = false,foundIndex = -1,i;
        for(i = index; i>=0 ; i--){
            if(arr[i].totalPoints != user.userActivities){
                break;
            }else{
                if((arr[i]._id).toString() === (user._id).toString()){
                    foundIndex = i;                
                    found = true;
                    break;
                }
            }
        }
        if(!found){
            for(i =index; i<arr.length; i++){
                if(arr[i].totalPoints != user.userActivities){
                    break;
                }else{
                    if(arr[i]._id === user_id){
                        foundIndex = i;
                        found = true;
                        break;
                    }
                }
            }
        }
        return foundIndex;
    }
}
module.exports = {
    userProfile: function userProfile(dataObject, response){
    },
    userRanking: function userRanking(dataObject, response){
        if(validator.validateObjectId(dataObject.user_id)){
            let User = new UserModel();
            async.parallel([
                function(callback){
                    let user_id = mongoose.Types.ObjectId(dataObject.user_id);
                    User.aggregate([{"$match":{"_id":user_id}},{"$project":{"_id":1,"rating":1,"review":1,"check_in":1,"userActivities":{"$add":["$rating","$review","$check_in"]}}}],function(err,result){
                        if(!err && result.length>0){
                            callback(null, result[0]);
                        }else{
                            callback(null)
                        }
                    });
                },
                function(callback){
                    User.aggregate([{"$project":{"_id":1,"totalPoints":{"$add":["$rating","$review","$check_in"]}}},{"$sort":{"totalPoints":-1}}],function(err,result){
                        if(!err && result.length>0){
                            callback(null, result);
                        }else{
                            callback(null);
                        }               
                    });
                }
            ],function(err,result){
                if(!err && result.length>0){
                    if(result[0].userActivities){
                        let index = USER.findIndex(result[1],result[0],0,result[1].length-1,0,parseInt(Math.log(result[1].length)));                    
                        if(index != null){
                            var Rank = USER.findMatch(result[1],index,result[0]);
                            if(Rank>=0){
                                let points = env.ranking.ratingPoint*result[0].rating + env.ranking.checkInPoint*result[0].check_in + env.ranking.reviewPoint*result[0].review; 
                              
                                let levelLength = env.ranking.levels.length;
                                let i;
                                for(i=1; i<levelLength; i++){//finding user level
                                    if(points > env.ranking.levels[i-1] && points < env.ranking.levels[i]){
                                        break;
                                    }
                                }
                                let user_level = "Level "+i;
                                let level_points = env.ranking.levels[i];
                                if(points<500){
                                    title = "THE ROOKIE";
                                }else if(points < 1700){
                                    title = "THE SHOPPER";
                                }else if(points < 4000){
                                    title = "THE EXPERIENCED SHOPPER";
                                }else if(points < 6000){
                                    title = "THE SHOPAHOLIC";
                                }else{
                                    title = "THE AFICIONADO";
                                }
                                let ob = {
                                    user_points: points,
                                    level_points: level_points,
                                    user_rank: Rank+1,
                                    level: user_level,
                                    title: title,
                                    next_level_points: env.ranking.levels[i+1]
                                }
                                utility.successDataRequest(ob,response);                 
                            }else{
                                utility.internalServerError(response);
                            }
                        }else{
                            utility.badRequest(response);
                        }                
                    }else{
                        let ob = {
                            user_points: 0,
                            level_points: 150,
                            user_rank: 0,
                            level: "",
                            title: "",
                            next_level_points: 300
                        }
                        utility.successDataRequest(ob,response);
                    }
                }else{
                    utility.internalServerError(response);
                }
            });
        }else{
            utility.badRequest(response);
        }
    }
}