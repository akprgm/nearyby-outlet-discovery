var mongoose = require('mongoose');
var fs = require('fs');
var redis = require('redis');
var async = require('async');
var jwt = require('jsonwebtoken');
var request = require('request');
var gm = require('gm');
var fcm = require('node-gcm');
var env = require('../env/development');
var utility = require('./utility');
var appModel = require('../models/appModel');
var fcmSender = new fcm.Sender(env.firebaseKey);
var notify = {
    notifyOnce: function notifyOnce(message,registrationTokens){
        fcmSender.sendNoRetry(message, { registrationTokens: registrationTokens }, function(err, response) {
            if(err) console.error(err);
            else    console.log(response);
        })
    },
    notifyRetry: function notifyRetry(message,registrationTokens){
        fcmSender.send(message, { registrationTokens: registrationTokens }, 10, function (err, response) {
            if(err) console.error(err);
            else    console.log(response);
        });
    }
}
module.exports = {
    notifyFollower: function notifyFollower(user_id, profile_id){//it notify user that a certain user started following him/her
        var message = new gcm.Message();
        async.waterfall([
            function(notifyFollowerCallback){
                async.parallel([
                    function(notifyUserCallback){
                        utility.userInfo(user_id,function(userInfo){//send notification to this user
                            if(userInfo){
                                notifyFollowerCallback(null,userInfo.firebase_token);
                            }else{
                                notifyFollowerCallback(true);
                            }
                        });
                    },
                    function(notifyUserCallback){
                        utility.userInfo(profile_id,function(userInfo){//send notification from this user
                            if(userInfo){
                                notifyUserCallback(null,userInfo);
                            }else{
                                notifyUserCallback(true);
                            }
                        });
                    }
                ],function(err, result){
                    if(!err && result){ 
                        notifyFollowerCallback(null,result);
                    }else{
                        notifyFollowerCallback(true);
                    }
                });
            },
            function(data,notifyFollowerCallback){
               utility.userBasicData(data[0],function(userBasicData){
                   notifyFollowerCallback(null,userBasicData,data[1]);
               }); 
            }
        ],function(err,result){
            let bodyText = result[0].name +" started following you."
            let firebase_token = new Array();
            firebase_token.push(result[1]);
            message.addNotification({//
                title: 'follow',
                body: bodyText,
                icon: 'faagio_logo'
            });
            message.addData('user_id',user_id);
            message.addData("user_pic",result[0].image);
            notify.notifyRetry(message,firebase_token);
        });
    },
    notifyReviewComment: function notifyReviewComment(review_id, profile_id){//this will notify all followers of user and user that someone commented on review
        async.waterfall([
            function(notifyReviewCommentCallback){
                let ReviewModel = mongoose.model('review'); 
                ReviewModel.findOne({"_id":review_id},{"user_id":1},function(err,result){
                    if(!err && result){
                        notifyReviewCommentCallback(null,result.user_id);
                    }else{
                        notifyReviewCommentCallback(true);
                    }    
                });
            },function(user_id,notifyReviewCommentCallback){
                async.parallel([
                    function(notifyUserCallback){
                        utility.userInfo(user_id,function(userInfo){//send notification to this user
                            if(userInfo){
                                notifyFollowerCallback(null,userInfo.firebase_token);
                            }else{
                                notifyFollowerCallback(true);
                            }
                        });
                    },
                    function(notifyUserCallback){
                        utility.userInfo(profile_id,function(userInfo){//send notification from this user
                            if(userInfo){
                                notifyUserCallback(null,userInfo);
                            }else{
                                notifyUserCallback(true);
                            }
                        });
                    }
                ],function(err, result){
                    if(!err && result){ 
                        notifyFollowerCallback(null,result);
                    }else{
                        notifyFollowerCallback(true);
                    }
                })
            },
            function(data,notifyFollowerCallback){
               utility.userBasicData(userInfo[0],function(userBasicData){
                   notifyReviewCommentCallback(null,userBasicData,data[1]);
               }); 
            }
        ],function(err,result){
            let bodyText = result[0].name +" commented on your Review."
            let firebase_token = new Array();
            firebase_token.push(result[1]);
            message.addNotification({
                title: 'review_comment',
                body: bodyText,
                icon: 'faagio_logo'
            });
            message.addData('review_id',review_id);
            message.addData("user_pic",result[0].image);
            notify.notifyRetry(message,firebase_token);
        }); 
    },
    notifyReviewLike: function notifyReviewLike(review_id, profile_id){//this will notify all followers of user and user that someone liked review
        async.waterfall([
            function(notifyReviewLikeCallback){
                let ReviewModel = mongoose.model('review'); 
                ReviewModel.findOne({"_id":review_id},{"user_id":1},function(err,result){
                    if(!err && result){
                        notifyReviewLikeCallback(null,result.user_id);
                    }else{
                        notifyReviewLikeCallback(true);
                    }    
                });
            },function(user_id,notifyReviewLikeCallback){
                async.parallel([
                    function(notifyUserCallback){
                        utility.userInfo(user_id,function(userInfo){//send notification to this user
                            if(userInfo){
                                notifyFollowerCallback(null,userInfo.firebase_token);
                            }else{
                                notifyFollowerCallback(true);
                            }
                        });
                    },
                    function(notifyUserCallback){
                        utility.userInfo(profile_id,function(userInfo){//send notification from this user
                            if(userInfo){
                                notifyUserCallback(null,userInfo);
                            }else{
                                notifyUserCallback(true);
                            }
                        });
                    }
                ],function(err, result){
                    if(!err && result){ 
                        notifyFollowerCallback(null,result);
                    }else{
                        notifyFollowerCallback(true);
                    }
                })
            },
            function(data,notifyFollowerCallback){
               utility.userBasicData(userInfo[0],function(userBasicData){
                   notifyReviewLikeCallback(null,userBasicData,data[1]);
               }); 
            }
        ],function(err,result){
            let bodyText = result[0].name +" liked your Review."
            let firebase_token = new Array();
            firebase_token.push(result[1]);
            message.addNotification({
                title: 'review_like',
                body: bodyText,
                icon: 'faagio_logo'
            });
            message.addData('review_id',review_id);
            message.addData("user_pic",result[0].image);
            notify.notifyRetry(message,firebase_token);
        }); 
    },
    notifyImageComment: function notifyImageComment(image_id, profile_id){//this will notify all followers of user and user that someone commented on image
        async.waterfall([
            function(notifyImageCommentCallback){
                let ImageModel = mongoose.model('image'); 
                ImageModel.findOne({"_id":image_id},{"user_id":1},function(err,result){
                    if(!err && result){
                        notifyImageCommentCallback(null,result.user_id);
                    }else{
                        notifyImageCommentCallback(true);
                    }    
                });
            },function(user_id,notifyImageCommentCallback){
                async.parallel([
                    function(notifyUserCallback){
                        utility.userInfo(user_id,function(userInfo){//send notification to this user
                            if(userInfo){
                                notifyFollowerCallback(null,userInfo.firebase_token);
                            }else{
                                notifyFollowerCallback(true);
                            }
                        });
                    },
                    function(notifyUserCallback){
                        utility.userInfo(profile_id,function(userInfo){//send notification from this user
                            if(userInfo){
                                notifyUserCallback(null,userInfo);
                            }else{
                                notifyUserCallback(true);
                            }
                        });
                    }
                ],function(err, result){
                    if(!err && result){ 
                        notifyFollowerCallback(null,result);
                    }else{
                        notifyFollowerCallback(true);
                    }
                })
            },
            function(data,notifyFollowerCallback){
               utility.userBasicData(userInfo[0],function(userBasicData){
                   notifyImageCommentCallback(null,userBasicData,data[1]);
               }); 
            }
        ],function(err,result){
            let bodyText = result[0].name +" liked your Image."
            let firebase_token = new Array();
            firebase_token.push(result[1]);
            message.addNotification({
                title: 'image_comment',
                body: bodyText,
                icon: 'faagio_logo'
            });
            message.addData('Image_id',Image_id);
            message.addData("user_pic",result[0].image);
            notify.notifyRetry(message,firebase_token);
        }); 
    },
    notifyImageLike: function notifyImageLike(image_id, profile_id){//this will notify all followers of user and user that someone liked image
        async.waterfall([
            function(notifyImageLikeCallback){
                let ImageModel = mongoose.model('image'); 
                ImageModel.findOne({"_id":image_id},{"user_id":1},function(err,result){
                    if(!err && result){
                        notifyImageLikeCallback(null,result.user_id);
                    }else{
                        notifyImageLikeCallback(true);
                    }    
                });
            },function(user_id,notifyImageLikeCallback){
                async.parallel([
                    function(notifyUserCallback){
                        utility.userInfo(user_id,function(userInfo){//send notification to this user
                            if(userInfo){
                                notifyFollowerCallback(null,userInfo.firebase_token);
                            }else{
                                notifyFollowerCallback(true);
                            }
                        });
                    },
                    function(notifyUserCallback){
                        utility.userInfo(profile_id,function(userInfo){//send notification from this user
                            if(userInfo){
                                notifyUserCallback(null,userInfo);
                            }else{
                                notifyUserCallback(true);
                            }
                        });
                    }
                ],function(err, result){
                    if(!err && result){ 
                        notifyFollowerCallback(null,result);
                    }else{
                        notifyFollowerCallback(true);
                    }
                })
            },
            function(data,notifyFollowerCallback){
               utility.userBasicData(userInfo[0],function(userBasicData){
                   notifyImageLikeCallback(null,userBasicData,data[1]);
               }); 
            }
        ],function(err,result){
            let bodyText = result[0].name +" liked your Image."
            let firebase_token = new Array();
            firebase_token.push(result[1]);
            message.addNotification({
                title: 'image_like',
                body: bodyText,
                icon: 'faagio_logo'
            });
            message.addData('Image_id',Image_id);
            message.addData("user_pic",result[0].image);
            notify.notifyRetry(message,firebase_token);
        });         
    },
    notifyOutletDiscount: function notifyOutletDiscount(){//this will notify all user who has liked this outlet about the new discount available
    },
    notifyNewOutletDiscount: function notifyNewOutletDiscount(){//this will notify all user within 1km to of new listed outlet
    },
    notifyUserSearch: function notifyUserCallback(){//this will notify outlets to user based on their search
    },
    test: function testNotificaton(){
        let message = new fcm.Message();        
        let bodyText = "testing is underway";
        let firebase_token = new Array();
        firebase_token.push('d_7i6dVAwP0:APA91bEPfOXIubPlbjyLqrfQN3XUiuDPBbJ-UbFra8JX1OFQvWTOFhv_D8bp_R7jXH9uD0k_3q4UCfGaI3_aUyM4hM9YDtZSljqWcbXnDubzZN6vBRhPBYt6qPbE1_7nD04UJ9FOt6bR','fmWcA72R18o:APA91bETL3Hr5Pfhj8L95qzo3IuaofYx8247_lOreGTtCk8OaT-xT1Mmd60kEgaKWlRd56WMFHKsmu_6OpQj6kb8kgYCJbi8abTQq7Tlbm5iHYDQOJ7UvfAMnfUozeK5OL6JXka20PZR');
        message.addNotification({
            title: 'follow',
            body: bodyText,
            icon: 'ic_logo'
        });
        message.addData('user',"tester");
        notify.notifyOnce(message,firebase_token);
    }
}
