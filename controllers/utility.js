var mongoose = require('mongoose');
var fs = require('fs');
var redis = require('redis');
var async = require('async');
var jwt = require('jsonwebtoken');
var request = require('request');
var gm = require('gm');
var env = require('../env/development');
var validator = require('./validator');
var appModel = require('../models/appModel.js');
var ImageModel = mongoose.model('image');
var redisClient = redis.createClient();
var redisFlag = true;
redisClient.on('error',function(err){
    redisFlag = false;
});
var utility = {
    user: function(user_id,userCallback){//getting basic user info from mongo
        var UserModel = mongoose.model('user'); 
        UserModel.findById(user_id,function(err,user){//finding user by mongo object id 
            if(err){
                userCallback(null);
            }else{
                userCallback(user);
            }
        });
    },
    outlet: function(outlet_id,outletInfoCallback){//getting basic outlet info from mongo
        var OutletModel = mongoose.model('outlet');
        OutletModel.findById(outlet_id,function(err,outlet){
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
        if(validator.validateObjectId(outlet_id)){
            if(redisFlag){
                redisClient.get(outlet_id,function(err,outlet){
                    if(outlet && !err){
                        outlet = JSON.parse(outlet);
                        redisClient.expire(outlet_id,3600*12);
                        callback(outlet);
                    }else{
                        utility.outlet(outlet_id,function(outlet){
                            redisClient.set(outlet_id,JSON.stringify(outlet));
                            redisClient.expire(outlet_id,3600*12);
                            callback(outlet);  
                        });
                    }
                });
            }else{
                var outletInfo = outletInfo(outlet_id);
                callback(outletInfo);
            }
        }else{//validation of id failed
            return false
        }  
    },
    checkImage: function checkImage(image_path,image_access_path,checkImageCallback){
        try{
            fs.open(image_path,'r',function(err,fd){
                if(!err && fd){
                    fs.closeSync(fd);
                    checkImageCallback(image_access_path);
                }else{
                    checkImageCallback(false);
                }
            });
        }catch(err){
            return false;
        }
    },
    checkOutletImage: function checkOutletImage(image,category,size,checkOutletImageCallback){
        let image_path = env.app.gallery_directory+"/"+category+"/gallery/images_"+size+"/"+image;
        let image_access_path = env.app.gallery_url+"/"+category+"/gallery/images_"+size+"/"+image;
        console.log(image_path);
        module.exports.checkImage(image_path,image_access_path,function(value){
            checkOutletImageCallback(value);
        });
    },
    outletDefaultCoverImage: function defaultImage(result){
        async.forEachOf(result,function(value,key,callback){
            let cover_image = value.outlet_info[0].cover_image;
            let category = value.outlet_info[0].category;
            let image_path = env.app.gallery_url+category+"/cover_images/"+cover_image;
            let image_access_path = env.app.gallery_url+category+"/cover_images/"+cover_image;            
            module.exports.checkImage(image_path,image_access_path,function(image_name){
                if(image_name){
                    value.outlet_info[0].cover_image = image_name;
                }else{
                    value.outlet_info[0].cover_image = env.app.gallery_url + "/s.jpg";
                }
            });
        },function(err){
            if(err){
                utility.internalServerError(response);
            }
        });
    },
    saveImage: function saveImage(imageObject,image,saveImagecallback){
        let imageBuff = new Buffer(image, 'base64');
        gm(imageBuff).identify(function(err,imageInfo){
            let imagePathOriginal = env.app.gallery_directory+imageObject.category+"/gallery/images_original/"+imageObject.image;                        
            let imagePath1024 = env.app.gallery_directory+imageObject.category+"/gallery/images_1024/"+imageObject.image;
            let imagePath500 = env.app.gallery_directory+imageObject.category+"/gallery/images_500/"+imageObject.image;
            if(imageInfo.format == 'JPEG'){
                async.parallel([
                    function(imageCallback){
                        gm(imageBuff).autoOrient().write(imagePathOriginal,function(err){
                            if(err){
                                fs.writeFileSync(imagePathOriginal,imageBuff);
                            }
                            module.exports.checkImage(imagePathOriginal,true,function(value){
                                imageCallback(null,value);
                            });
                        });
                    },
                    function(imageCallback){
                        gm(imageBuff).autoOrient().resize(null,1024).write(imagePath1024,function(err){
                            if(err){
                                fs.writeFileSync(imagePathOriginal,imageBuff);
                            }
                            module.exports.checkImage(imagePath1024,true,function(value){
                                imageCallback(null,value);
                            });
                        });
                    },
                    function(imageCallback){
                        gm(imageBuff).autoOrient().resize(null,500).write(imagePath500,function(err){
                            if(err){
                                fs.writeFileSync(imagePathOriginal,imageBuff);
                            }
                            module.exports.checkImage(imagePath500,true,function(value){
                                imageCallback(null,value);
                            });
                        });
                    }
                ],function(err,result){
                    if(!err && result[0] && result[1] && result[2]){
                        let image = new ImageModel(imageObject);
                        image.save(function(err,result){
                            if(!err && result){
                                saveImagecallback(result._id);                            
                            }else{
                                saveImagecallback(false);
                            }
                        })
                    }else{
                        saveImagecallback(false);
                    }
                })
            }else{
                saveImagecallback(false);               
            }
        });
    },
    saveUserReviews: function saveUserReviews(dataObject){
        if(redisFlag && validator.validateObjectId(dataObject.user_id) && validator.validateObjectId(dataObject.outlet_id)){
            let userReviewKey = dataObject.user_id+":reviews";
            let ReviewModel = mongoose.model('review');
            let user_id = mongoose.Types.ObjectId(dataObject.user_id);
            ReviewModel.aggregate([{"$lookup":{"from":"outlets","localField":"outlet_id","foreignField":"_id","as":"outlet_info"}},{"$match":{"user_id":user_id,"review":{"$ne":""},"outlet_info":{"$ne":[]}}},{"$project":{"_id":0,"rating_id":"$_id ","date":1,"star":1,"review":1,"likes":{"$size":"$likes"},"comments":{"$size":"$comments"},"outlet_info._id":1,"outlet_info.name":1,"outlet_info.name":1,"outlet_info.cover_image":1,"outlet_info.locality":1,"outlet_info.category":1}},{"$sort":{"date":-1}}],function(err,result){
                if(!err && result){
                    module.exports.outletDefaultCoverImage(result);
                    module.exports.redisSaveKey(userReviewKey,JSON.stringify(result));
                }
            });
            let outletReviewKey = dataObject.outlet_id+":reviews";
            let outlet_id = mongoose.Types.ObjectId(dataObject.outlet_id);
            ReviewModel.aggregate([{"$lookup":{"from":"outlets","localField":"outlet_id","foreignField":"_id","as":"outlet_info"}},{"$lookup":{"from":"users","localField":"user_id","foreignField":"_id","as":"user_info"}},{"$match":{"outlet_id":outlet_id,"review":{"$ne":""},"outlet_info":{"$ne":[]},"user_info":{"$ne":[]}}},{"$project":{"_id":0,"rating_id":"$_id ","date":1,"star":1,"review":1,"likes":{"$size":"$likes"},"comments":{"$size":"$comments"},"outlet_info._id":1,"outlet_info.name":1,"outlet_info.cover_image":1,"outlet_info.locality":1,"outlet_info.category":1,"user_info._id":1,"user_info.image":1,"user_info.image":1}},{"$sort":{"date":-1}}],function(err,result){
                if(!err && result){
                    module.exports.outletDefaultCoverImage(result);
                    module.exports.redisSaveKey(outletReviewKey,JSON.stringify(result));
                }
            });
        }
    },
    saveUserRating: function saveUserRating(dataObject){
        if(redisFlag && validator.validateObjectId(dataObject.user_id)){
            var ratingKey = dataObject.user_id+":ratings";
            let RatingModel = mongoose.model('rating');
            let user_id = mongoose.Types.ObjectId(dataObject.user_id);
            RatingModel.aggregate([{"$lookup":{"from":"outlets","localField":"outlet_id","foreignField":"_id","as":"outlet_info"}},{"$match":{"user_id":user_id,"outlet_info":{"$ne":[]}}},{"$project":{"_id":0,"rating_id":"$_id","date":1,"star":1,"outlet_info._id":1,"outlet_info.name":1,"outlet_info.cover_image":1,"outlet_info.locality":1,"outlet_info.category":1}},{"$sort":{"date":-1}}],function(err,result){
                if(!err && result){
                    module.exports.outletDefaultCoverImage(result);
                    module.exports.redisSaveKey(ratingKey,JSON.stringify(result));
                }
            });
        }
    },
    saveOutletDetails : function saveOutletDetails(dataObject){
        if(redisFlag && validator.validateObjectId(dataObject.outlet_id)){
            async.waterfall([
                function(callback){//finding the outlet Deatils
                    let Outlet = models.outlet;
                    let outlet_id = mongoose.Types.ObjectId(dataObject.outlet_id);
                    Outlet.find({"_id":outlet_id,"status":true},function(err,outlet){
                        if(!err && outlet.length>0){
                            callback(null,outlet[0]);
                        }else{
                            utility.badRequest(response);
                        }
                    });         
                },
                function(outlet,callback){//manipulating outlet object
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
                    switch(outlet.category){//creating outlet object based on their category
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
                    //getting outlet review and images 
                    async.parallel([
                        function(callback2){//getting latest 2 reviews for this outlet
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
                        function(callback2){//getting latest 4 images uploaded for this outlet
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
                    module.exports.redisSaveKey(dataObject.outlet_id,JSON.stringify(result));         
                }
            });
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
                    jwt.verify(token,env.secretKey,{ignoreExpiration:true},function(err,decoded){
                        if(err){
                            module.exports.badRequest(response);
                        }else if(decoded){
                            callback();
                        }else{
                            module.exports.unauthorizedRequest(response);
                        }
                    });                
                break;
            default:
                    jwt.verify(token,env.secretKey,function(err,decoded){
                        if(err){
                            module.exports.unauthorizedRequest(response);
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
