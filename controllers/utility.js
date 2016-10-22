var mongoose = require('mongoose');
var redis = require('redis');
var async = require('async');
var jwt = require('jsonwebtoken');
var env = require('../env/development');
var models = require('../models/appModel');
var validator = require('./validator');
var redisClient = redis.createClient();
var redisFlag = true;
redisClient.on('error',function(err){
    redisFlag = false;
});
var utility = {
    user: function(user_id,userCallback){//getting basic user info from mongo
        var userModel = models.user;
        var user = new userModel();//getting user model 
        user.findById(user_id,function(err,user){//finding user by mongo object id 
            if(err){
                userCallback(null);
            }else{
                userCallback(user);
            }
        });
    },
    outlet: function(outlet_id,outletInfoCallback){//getting basic outlet info from mongo
        var outletModel = models.outlet;
        var outlet = new outletModel();
        outlet.findById(outlet_id,function(err,outlet){
            if(err){
                outletInfoCallback(null);
            }else{
                outletInfoCallback(outlet);
            }
        })
    }
} 
module.exports = {
    redisFindKey: function redisFidecodedndKey(key,callback){
        key = key.toString();
        if(redisFlag){
            redisClient.get(key,function(err,result){
                if(result && !err){ 
                    redisClient.expire(key,3600*48)
                    callback(result);
                }else{
                    callback(null);
                }
            });
        }else{
          callback(null); 
        }
    },
    redisSaveKey: function redisSaveKey(key,data){
        key = key.toString();
        if(redisFlag){
            redisClient.set(key,data);
            redisClient.expire(key,3600*48)
        }
        return ;
    },
    redisSetExpireTime: function expireKeyTime(key){
        key = key.toString();
        if(redisFlag){
            redisClient.expire(key,3600*48)
        }
        return ;
    },
    userInfo: function userInfo(user_id,callback){//getting user basic info        
        if(validator.validateObjectId(user_id)){
            if(redisFlag){
                redisClient.get(user_id,function(err,user){//checking for user info in redis cache
                    if(user && !err){//found user in our cache store
                        user = JSON.parse(user);
                        redisClient.expire(user_id,3600*48);
                        callback(user);
                    }else{//getting user info from mongodb and storing it in our redis cache store
                        utility.user(user_id,function(user){
                            user_id = user_id.toString();
                            redisClient.set(user_id,JSON.stringify(user));
                            redisClient.expire(user_id,3600*12);
                            callback(user); 
                        }); 
                    }
                });
            }else{
                utility.user(user_id,function(user){
                    callback(user);
                });
            }
        }else{//validation of id failed
            callback(false);
        }
    },
    userSendData: function userSendData(user,callback){
        let data = {
            user_id: user._id,
            name: user.name,
            image: user.image,
            access_token: user.access_token,
            refresh_token: user.refresh_token,
            review: user.review,
            rating: user.rating,
        }
        callback(data);
    },
    userBasicData: function userBasicData(user,callback){
        let basicInfo = {
            user_id: user._id,
            name: user.name,
            image: (user.image)?user.image:"default_user_pic.jpg"
        }
        callback(basicInfo);    
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
    sendMail: function sendMail(outlet_id,callback){
    },
    successDataRequest: function successDataRequest(data,response){
        var data = {
            status: true,
            message: data
        }
        response.statusCode = 200;
        response.send(data);
    },
    successRequest: function successRequest(response){
        var data = {
            status: true,
            message: "request proccessed successfully."
        }
        response.statusCode = 200;
        response.send(data);
    },
    failureRequest: function failerRequest(response){
        var data = {
            status: true,
            message: "no content found"
        }
        response.statusCode = 204;
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
    unauthorizedRequest: function unauthorized(response){
        var data = {
            status: false,
            message: "authentication failure"
        }
        response.statusCode = 401;
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
    conflictRequest: function conflict(response){
        var data = {
            status: false,
            message: "conflict in processing this request."
        }
        response.statusCode = 409;
        response.send(data);
    },
    verifyToken: function verifyToken(token,type,response,callback){
        switch (type) {
            case 'refresh':
                    jwt.verify(token,env.secretKey,{ignoreExpires:true},function(err,decoded){
                        if(err){
                            module.exports.badRequest(response);
                        }else if(decoded){
                            callback();
                        }else{
                            response.send(decoded);
                            module.exports.unauthorizedRequest(response);
                        }
                    });                
                break;
            default:
                    jwt.verify(token,env.secretKey,function(err,decoded){
                        if(err){
                            module.exports.badRequest(response);
                        }else if(decoded){
                            callback();
                        }else{
                            module.exports.unauthorizedRequest(response);
                        }
                    });
                break;
        }
    }
}
