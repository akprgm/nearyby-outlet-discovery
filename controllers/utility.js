var mongoose = require('mongoose');
var redis = require('redis');
var async = require('async');
var models = require('../models/appModel');
var validator = require('./validator');
var redisClient = redis.createClient();
var redisFlag = true;
redisClient.on('error',function(err){
    redisFlag = false;
})
var utility = {
    userInfo: function(user_id,callback){//getting basic user info from mongo
        var userModel = models.user;
        var user = new userModel();//getting user model 
        user.findById(user_id,function(err,user){//finding user by mongo object id 
            if(err){
                callback(null);
            }else{
                callback(user);
            }
        });
    },
    outletInfo: function(outlet_id,callback){//getting basic outlet info from mongo
        var outletModel = models.outlet;
        var outlet = new outletModel();
        outlet.findById(outlet_id,function(err,outlet){
            if(err){
                callback(null);
            }else{
                callback(outlet);
            }
        })
    }
} 
module.exports = {
    userInfo: function userInfo(user_id,callback){//getting user basic info        
        if(validator.validateObjectId(user_id)){
            if(redisFlag){
                redisClient.get(user_id,function(err,user){//checking for user info in redis cache
                    if(user && !err){//found user in our cache store
                        user = JSON.parse(user);
                        var userInfo = {
                            "user_id": user._id,
                            "name": user.name,
                            //"image": user.image,
                        }
                        redisClient.expire(user_id,3600*12);
                        callback(userInfo);
                    }else{//getting user info from mongodb and storing it in our redis cache store
                        utility.userInfo(user_id,function(userInfo){
                            redisClient.set(user_id,JSON.stringify(userInfo));
                            redisClient.expire(user_id,3600*12);
                            callback(userInfo); 
                        }); 
                    }
                });
            }else{
                utility.userInfo(user_id,function(userInfo){
                    console.log(userInfo);
                    callback(userInfo);
                });
            }
        }else{//validation of id failed
            callback(false);
        }
    },
    outletInfo: function outletInfo(outlet_id,callback){
        if(validator.validateUserId(outlet_id)){
            if(redisFlag){
                redisClient.get(outlet_id,function(err,outlet){
                    if(outlet && !err){
                        outlet = JSON.parse(outlet);
                        var outletInfo = {
                            "outlet_id": outlet._id,
                            "name": outlet.name,
                            "cover_image": outlet.cover_image
                        }
                        redisClient.expire(outlet_id,3600*12);
                        callback(outletInfo);
                    }else{
                        var outletInfo = utility.outletInfo(outlet_id);
                        redisClient.set(outlet_id,JSON.stringify(outlet));
                        redisClient.expire(outlet_id,3600*12);
                        callback(outletInfo);  
                    }
                });
            }else{
                var outletInfo = outletInfo(outlet_id);
                callback(outletInfo);
            }
            var outletModel = models.outlet;
            var outlet = new outletModel();
            outlet.findById(outlet_id,function(err,outlet){
                if(err){
                    return false;
                }else{
                    var outletInfo = {
                        "outlet_id": outlet._id,
                        "name": outlet.name,
                        "cover_image": outlet.cover_image
                    }
                    callback(outletInfo);                
                }
            })
        }else{//validation of id failed
            return false
        }  
    },
    successRequest: function successRequest(response){
        var data = {
            status: true,
            message: "request proccessed successfully."
        }
        response.statusCode = 409;
        response.send(data);
    },
    badRequest: function badRequest(response){
        var data = {
            status: false,
            message: "invalid request "
        }
        response.statusCode = 400;
        response.send(data);
    },
    internalServerError: function internalError(response){
        var data = {
            status: false,
            message: "internal server error, please try later."
        }
        response.statusCode = 500;
        response.send(data);
    },
    conflictRequest :function conflict(response){
        var data = {
            status: false,
            message: "conflict in processing this request."
        }
        response.statusCode = 409;
        response.send(data);
    } 
}
