var mongoose = require('mongoose');
var redis = require('redis');
var async = require('async');
var request = require('request');
var validator = require('../validator');
var utility = require('../utility');
var env = require('../../env/development.js');
var UserModel = mongoose.model('user');
var FeedbackModel = mongoose.model('feedback');
var USER = {
    findRank : function findRank(user_id,arrOfUser,rankCallback){
            let i=0;
            async.detect(arrOfUser,function(value,valueCallback){
                if(String(value._id) == String(user_id)){
                    console.log(value);
                    valueCallback(null,true);
                }else{
                    valueCallback(null,false);
                }
                i++;
            },function(err,result){
                if(!err && result){
                    rankCallback(i);
                }else{
                    rankCallback(0);
                }                
            });
        }
}
module.exports = {
    userProfile: function userProfile(dataObject, response){
        if(validator.validateObjectId(dataObject.user_id) && validator.validateOffset(dataObject.offset)){
            async.parallel([
                function(callback){//getting user reviews
                    var reviewUrl = env.app.url+"getUserReviews?access_token="+dataObject.access_token+"&user_id="+dataObject.user_id+"&offset="+dataObject.offset;
                    request(reviewUrl,function(err,res,body){
                        if(!err && res.statusCode ==200){
                            let data = JSON.parse(body);
                            callback(null,data.message);                    
                        }else if(!err && res.statusCode ==204){
                            callback(null, new Array());
                        }else{
                            callback(null);
                        }
                    });
                },
                function(callback){//getting user ratings
                    var ratingUrl = env.app.url+"getUserRatings?access_token="+dataObject.access_token+"&user_id="+dataObject.user_id+"&offset="+dataObject.offset;;
                    request(ratingUrl,function(err,res,body){
                        if(!err && res.statusCode ==200){
                            let data = JSON.parse(body);
                            callback(null,data.message);                    
                        }else if(!err && res.statusCode ==204){
                            callback(null, new Array());
                        }else{
                            callback(null);
                        }
                    });
                },
                function(callback){//getting user checkins
                    var checkInUrl = env.app.url+"getUserCheckIns?access_token="+dataObject.access_token+"&user_id="+dataObject.user_id+"&offset="+dataObject.offset;;
                    request(checkInUrl,function(err,res,body){
                        if(!err && res.statusCode ==200){
                            let data = JSON.parse(body);
                            callback(null,data.message);                    
                        }else if(!err && res.statusCode==204){
                            callback(null, new Array());
                        }else{
                            callback(null);
                        }
                    });
                },
                function(callback){//getting user pics
                    var userPicsUrl = env.app.url+"getUserPics?access_token="+dataObject.access_token+"&user_id="+dataObject.user_id+"&offset="+dataObject.offset;;
                    request(userPicsUrl,function(err,res,body){
                        if(!err && res.statusCode ==200){
                            let data = JSON.parse(body);
                            callback(null,data.message);                    
                        }else if(!err && res.statusCode==204){
                            callback(null, new Array());
                        }else{
                            callback(null);
                        }
                    });
                },
                function(callback){//getting basic user info
                    var userInfoUrl = env.app.url+"userInfo?access_token="+dataObject.access_token+"&user_id="+dataObject.user_id;
                    request(userInfoUrl,function(err,res,body){
                        if(!err && res.statusCode == 200){
                            let data = JSON.parse(body);
                            callback(null,data.message);                    
                        }else{
                            callback(null);
                        }
                    }); 
                }
            ],function(err, results){
                 if(!err && results.length>0){
                    var jsonObject = {
                        status: true,
                        reviews: results[0],
                        ratings: results[1],
                        checkIns: results[2],
                        photos: results[3],
                        user_info: results[4]
                    }
                    response.send(jsonObject);
                }else{
                    utility.internalServerError(response);
                }
            })
        }else{
            utility.badRequest(response);
        } 
    },
    userRanking: function userRanking(dataObject, response){
        if(validator.validateObjectId(dataObject.user_id)){
            async.parallel([
                function(callback){
                    let user_id = mongoose.Types.ObjectId(dataObject.user_id);
                    UserModel.aggregate([{"$match":{"_id":user_id}},{"$project":{"_id":1,"rating":1,"review":1,"check_in":1,"image_uploaded":1,"userActivities":{"$add":["$rating","$review","$check_in"]}}}],function(err,result){
                        if(!err && result.length>0){
                            callback(null, result[0]);
                        }else{
                            callback(null)
                        }
                    });
                },
                function(callback){
                    UserModel.aggregate([{"$project":{"_id":1,"totalPoints":{"$add":["$rating","$review","$check_in"]}}},{"$sort":{"totalPoints":-1}}],function(err,result){
                        if(!err && result.length>0){
                            callback(null, result);
                        }else{
                            callback(null);
                        }               
                    });
                }
            ],function(err,result){
                if(!err && result.length>0){
                    if(result[0]){
                        USER.findRank(result[0]._id,result[1],function(Rank){
                            if(Rank>=0){
                                let points = env.ranking.ratingPoint*result[0].rating + env.ranking.checkInPoint*result[0].check_in + env.ranking.reviewPoint*result[0].review; 
                                let levelLength = env.ranking.levels.length;
                                let i;
                                for(i=1; i<levelLength; i++){//finding user level
                                    if(points > env.ranking.levels[i-1] && points < env.ranking.levels[i]){
                                        break;
                                    }
                                }
                                if(i >= env.ranking.levels.length){
                                    i=0;
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
                                    review: result[0].review,
                                    rating: result[0].rating,
                                    next_level_points: env.ranking.levels[i+1]
                                }
                                utility.successDataRequest(ob,response);                 
                            }else{
                                utility.internalServerError(response);
                            }
                        });               
                    }else{
                        let ob = {
                            user_points: 0,
                            level_points: 150,
                            user_rank: 0,
                            "reviews": 0,
                            "ratings": 0,
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
    },
    followProfile: function followProfile(dataObject, response){
        if(validator.validateObjectId(dataObject.user_id) && validator.validateObjectId(dataObject.profile_id)){
            UserModel.update({"_id":dataObject.user_id},{"$pull":{"likedProfiles":dataObject.profile_id}},function(err,result){
                if(!err && result.nModified>0){//already liked by user
                    utility.successRequest(response);
                }else{//liking profile
                    UserModel.update({"_id":dataObject.user_id},{"$push":{"likedProfiles":dataObject.profile_id}},function(err,result){
                        if(!err && result.nModified>0){
                            utility.successRequest(response);                            
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
    likeOutlet: function likeOutlet(dataObject, response){
        if(validator.validateObjectId(dataObject.user_id) && validator.validateObjectId(dataObject.outlet_id)){
            UserModel.update({"_id":dataObject.user_id},{"$pull":{"followedOutlets":dataObject.outlet_id}},function(err,result){
                if(!err && result.nModified>0){//already liked by user
                    utility.successRequest(response);
                }else{//liking profile
                    UserModel.update({"_id":dataObject.user_id},{"$push":{"followedOutlets":dataObject.outlet_id}},function(err,result){
                        if(!err && result.nModified>0){
                            utility.successRequest(response);                            
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
    feedback: function feedback(dataObject, response){
        if(validator.validateObjectId(dataObject.user_id) && typeof(dataObject.feedback) == 'string'){
             let obj = {
                user_id: dataObject.user_id,
                feedback: dataObject.feedback,
                date: (new Date).getTime(),
            }
            let feedback = new FeedbackModel(obj);
            feedback.save(function(err,result){
                if(err){
                    utility.internalServerError(response);
                }else{
                    utility.successRequest(response);
                }
            });
        }else{
            utility.badRequest(response);
        }
    }  
}