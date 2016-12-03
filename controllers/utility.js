var mongoose = require('mongoose');
var fs = require('fs');
var redis = require('redis');
var async = require('async');
var jwt = require('jsonwebtoken');
var request = require('request');
var gm = require('gm');
var nodemailer = require('nodemailer');// create reusable transporter object using the default SMTP transport
var env = require('../env/development');
var validator = require('./validator');
var appModel = require('../models/appModel.js');
var ImageModel = mongoose.model('image');
var redisClient = redis.createClient();
var transporter = nodemailer.createTransport(env.mail);
var redisFlag = true;
redisClient.on('error',function(err){
    redisFlag = false;
});
var utility = {
    /*@Desc : getting user from mongo using user document id 
        * @Param : user document id
        * @Return : user document
    */
    user: function(user_id,userCallback){
        var UserModel = mongoose.model('user'); 
        UserModel.findById(user_id,function(err,user){ 
            if(err){
                userCallback(null);
            }else{
                userCallback(user);
            }
        });
    },
    /*@Desc : finding outlet from mongo using outlet document id 
        * @Param : outlet document id
        * @Return : outlet document
    */
    outlet: function(outlet_id,outletInfoCallback){//getting outlet from mongo
        var OutletModel = mongoose.model('outlet');
        OutletModel.findById(outlet_id,function(err,outlet){//finding outlet by mongo document id 
            if(err){
                outletInfoCallback(null);
            }else{
                outletInfoCallback(outlet);
            }
        });
    }
} 
module.exports = {
     /*@Desc : this will find the key in redis and return the result 
        * @Param : redis key
        * @Return : value of redis key provided
    */
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
     /*@Desc : this will store the results with key in redis 
        * @Param :  redis key
        * @Return : value of redis key provided
    */
    redisSaveKey: function redisSaveKey(key,data){
        key = key.toString();
        if(redisFlag){
            redisClient.set(key,data);
            redisClient.expire(key,3600*48)
        }
        return ;
    },
     /*@Desc : finding outlet from mongo using outlet document id 
        * @Param : outlet document id
        * @Return : outlet document
    */
    redisSetExpireTime: function expireKeyTime(key){//this will reset the expire time of key in redis
        key = key.toString();
        if(redisFlag){
            redisClient.expire(key,3600*48)
        }
        return ;
    },
     /*@Desc : finding outlet from mongo using outlet document id 
        * @Param : outlet document id
        * @Return : outlet document
    */
    userInfo: function userInfo(user_id,callback){//getting user        
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
     /*@Desc : finding outlet from mongo using outlet document id 
        * @Param : outlet document id
        * @Return : outlet document
    */
    userSendData: function userSendData(user,userSendDataCallback){//user data used in profile api
        let data = {
            user_id: user._id,
            name: user.name,
            image: user.image,
            access_token: user.access_token,
            refresh_token: user.refresh_token,
            review: user.review,
            rating: user.rating,
        }
        userSendDataCallback(data);
    },
     /*@Desc : finding outlet from mongo using outlet document id 
        * @Param : outlet document id
        * @Return : outlet document
    */
    userBasicData: function userBasicData(user,userBasicDataCallback){//this will return the 
        let basicInfo = {
            user_id: user._id,
            name: user.name,
            image: (user.image)?user.image:"default_user_pic.jpg"
        }
        userBasicDataCallback(basicInfo);    
    },
     /*@Desc : finding outlet from mongo using outlet document id 
        * @Param : outlet document id
        * @Return : outlet document
    */
    outletInfo: function outletInfo(outlet_id,outletInfoCallback){
        if(validator.validateObjectId(outlet_id)){
            if(redisFlag){
                redisClient.get(outlet_id,function(err,outlet){
                    if(outlet && !err){
                        outlet = JSON.parse(outlet);
                        redisClient.expire(outlet_id,3600*12);
                        outletInfoCallback(outlet);
                    }else{
                        utility.outlet(outlet_id,function(outlet){
                            redisClient.set(outlet_id,JSON.stringify(outlet));
                            redisClient.expire(outlet_id,3600*12);
                            outletInfoCallback(outlet);  
                        });
                    }
                });
            }else{
                var outletInfo = outletInfo(outlet_id);
                outletInfoCallback(outletInfo);
            }
        }else{//validation of id failed
            return false
        }  
    },
     /*@Desc : finding outlet from mongo using outlet document id 
        * @Param : outlet document id
        * @Return : outlet document
    */
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
     /*@Desc : finding outlet from mongo using outlet document id 
        * @Param : outlet document id
        * @Return : outlet document
    */
    checkOutletImage: function checkOutletImage(image,category,size,checkOutletImageCallback){
        let image_path = env.app.gallery_directory+"/"+category+"/gallery/images_"+size+"/"+image;
        let image_access_path = env.app.gallery_url+"/"+category+"/gallery/images_"+size+"/"+image;
        console.log(image_path);
        module.exports.checkImage(image_path,image_access_path,function(value){
            checkOutletImageCallback(value);
        });
    },
     /*@Desc : finding outlet from mongo using outlet document id 
        * @Param : outlet document id
        * @Return : outlet document
    */
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
     /*@Desc : finding outlet from mongo using outlet document id 
        * @Param : outlet document id
        * @Return : outlet document
    */
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
     /*@Desc : finding outlet from mongo using outlet document id 
        * @Param : outlet document id
        * @Return : outlet document
    */
    saveUserReviews: function saveUserReviews(dataObject){
        if(redisFlag && validator.validateObjectId(dataObject.user_id) && validator.validateObjectId(dataObject.outlet_id)){
            let userReviewKey = dataObject.user_id+":reviews";
            let ReviewModel = mongoose.model('review');
            let user_id = mongoose.Types.ObjectId(dataObject.user_id);
            ReviewModel.aggregate([{"$lookup":{"from":"outlets","localField":"outlet_id","foreignField":"_id","as":"outlet_info"}},{"$match":{"$and":[{"user_id":user_id},{"review":{"$ne":""}},{"outlet_info":{"$ne":[]}}]}},{"$project":{"_id":0,"rating_id":"$_id ","date":1,"star":1,"review":1,"likes":{"$size":"$likes"},"comments":{"$size":"$comments"},"outlet_info._id":1,"outlet_info.name":1,"outlet_info.name":1,"outlet_info.cover_image":1,"outlet_info.locality":1,"outlet_info.category":1}},{"$sort":{"date":-1}}],function(err,result){
                if(!err && result){
                    module.exports.outletDefaultCoverImage(result);
                    module.exports.redisSaveKey(userReviewKey,JSON.stringify(result));
                }
            });
            let outletReviewKey = dataObject.outlet_id+":reviews";
            let outlet_id = mongoose.Types.ObjectId(dataObject.outlet_id);
            ReviewModel.aggregate([{"$lookup":{"from":"outlets","localField":"outlet_id","foreignField":"_id","as":"outlet_info"}},{"$lookup":{"from":"users","localField":"user_id","foreignField":"_id","as":"user_info"}},{"$match":{"$and":[{"outlet_id":outlet_id},{"review":{"$ne":""}},{"outlet_info":{"$ne":[]}},{"user_info":{"$ne":[]}}]}},{"$project":{"_id":0,"rating_id":"$_id ","date":1,"star":1,"review":1,"likes":{"$size":"$likes"},"comments":{"$size":"$comments"},"outlet_info._id":1,"outlet_info.name":1,"outlet_info.cover_image":1,"outlet_info.locality":1,"outlet_info.category":1,"user_info._id":1,"user_info.image":1,"user_info.image":1}},{"$sort":{"date":-1}}],function(err,result){
                if(!err && result){
                    module.exports.outletDefaultCoverImage(result);
                    module.exports.redisSaveKey(outletReviewKey,JSON.stringify(result));
                }
            });
        }
        return;
    },
     /*@Desc : finding outlet from mongo using outlet document id 
        * @Param : outlet document id
        * @Return : outlet document
    */
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
     /*@Desc : finding outlet from mongo using outlet document id 
        * @Param : outlet document id
        * @Return : outlet document
    */
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
     /*@Desc : finding outlet from mongo using outlet document id 
        * @Param : outlet document id
        * @Return : outlet document
    */
    sendMail: function sendMail(outlet_id,callback){
    },
     /*@Desc : finding outlet from mongo using outlet document id 
        * @Param : outlet document id
        * @Return : outlet document
    */
    successDataRequest: function successDataRequest(data,response){
        var data = {
            status: true,
            message: data
        }
        response.statusCode = 200;
        response.send(data);
    },
     /*@Desc : finding outlet from mongo using outlet document id 
        * @Param : outlet document id
        * @Return : outlet document
    */
    successRequest: function successRequest(response){
        var data = {
            status: true,
            message: "request proccessed successfully."
        }
        response.statusCode = 200;
        response.send(data);
    },
     /*@Desc : finding outlet from mongo using outlet document id 
        * @Param : outlet document id
        * @Return : outlet document
    */
    failureRequest: function failerRequest(response){
        var data = {
            status: true,
            message: "no content found"
        }
        response.statusCode = 204;
        response.send(data);
    },
     /*@Desc : finding outlet from mongo using outlet document id 
        * @Param : outlet document id
        * @Return : outlet document
    */
    badRequest: function badRequest(response){
        var data = {
            status: false,
            message: "invalid request "
        }
        response.statusCode = 400;
        response.send(data);
    },
     /*@Desc : finding outlet from mongo using outlet document id 
        * @Param : outlet document id
        * @Return : outlet document
    */
    notFoundRequest: function notFound(response){
        var data = {
            status: false,
            message: "invalid request "
        }
        response.statusCode = 404;
        response.send(data);
    },
     /*@Desc : finding outlet from mongo using outlet document id 
        * @Param : outlet document id
        * @Return : outlet document
    */
    unauthorizedRequest: function unauthorized(response){
        var data = {
            status: false,
            message: "authentication failure"
        }
        response.statusCode = 401;
        response.send(data);
    },
     /*@Desc : finding outlet from mongo using outlet document id 
        * @Param : outlet document id
        * @Return : outlet document
    */
    internalServerError: function internalError(response){
        var data = {
            status: false,
            message: "internal server error, please try later."
        }
        response.statusCode = 500;
        response.send(data);
    },
     /*@Desc : finding outlet from mongo using outlet document id 
        * @Param : outlet document id
        * @Return : outlet document
    */
    conflictRequest: function conflict(response){
        var data = {
            status: false,
            message: "conflict in processing this request."
        }
        response.statusCode = 409;
        response.send(data);
    },
     /*@Desc : finding outlet from mongo using outlet document id 
        * @Param : outlet document id
        * @Return : outlet document
    */
    verifyToken: function verifyToken(token,type,response,verifyTokenCallback){
        switch (type) {
            case 'refresh':
                jwt.verify(token,env.secretKey,{ignoreExpiration:true},function(err,decoded){
                    if(err){
                        module.exports.badRequest(response);
                    }else if(decoded){
                        verifyTokenCallback(decoded);
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
                        verifyTokenCallback(decoded);
                    }else{
                        module.exports.unauthorizedRequest(response);
                    }
                });
            break;
        }
    },
     /*@Desc : finding outlet from mongo using outlet document id 
        * @Param : outlet document id
        * @Return : outlet document
    */
    registerMail: function sendMail(user_mail){
        var mailOptions = {
            from: 'info@faagio.com',// sender address
            to: user_mail,// list of receivers
            subject: 'Welcome to Faagio', // Subject line
            text: 'Hi '+data.uname+'thanks for joining us, please active ur account here https://www.faagio.com/activate?',
            html: '<!doctype html><html><head><meta charset="utf-8"><title>Faagio.com - Sign Up</title></head><body id="signup" style=" background-color: #fff;color: #595655;font-family: "Helvetica Neue",Helvetica,Arial,sans-serif;font-size: 14px;line-height: 1.42857;"><div class="container" style="margin:0 auto;background: #fbfbf3 none repeat scroll 0 0;width: 800px;padding: 0 15px;"> <div class="inner_container" style="margin: 0 auto;overflow: hidden;width:760px;"> <div class="header_top" style=" float: left;margin: 10px 0;width: 100%;"></div> <div class="col-sm-3" style="min-height: 1px;position: relative;width:25%;float:left;"> <div class="row" style="margin-left: -15px;margin-right: -15px;"> <img style="left: 35px;position: relative;top: 34px;width: 55%;margin-top:32px;" id="logo" src="##logo##" alt="faagio"/> </div> </div> <div class="col-sm-9" style="min-height: 1px;position: relative;width:75%;float:left;"> <div class="row" style="margin-left: -15px;margin-right: -15px;"> <span class="title" style="font-family: bakery;font-size: 88pt;font-weight: bold;">Hey There!</span> </div> </div> <div class="header_top" style=" float: left;margin: 10px 0;width: 100%;"></div> <div class="col-sm-3" style="float: left;min-height: 1px;padding: 0 15px;position: relative;width: 21%;"> <div class="row" style="margin-left: -15px;margin-right: -15px;"> <img style="float: left;width: 90%;" class="gallery" src="##galleryimg##" alt="gallery"/> </div> </div> <div class="col-sm-9" style="min-height: 1px;position: relative;width:75%;float:left;"> <div class="row" style="margin-left: -15px;margin-right: -15px;"> <p class="bold_font" style="font-family: avalonbold;font-size: 16.9pt;font-weight: 800;margin: 0;margin-bottom:10px;">WE CAN\'T EVEN BEGIN TO TELL YOU HOW GOOD<br/>IT FEELS TO HAVE YOU AS OUR CUSTOMER!</p> <div class="green_row" style="border-bottom: 2px solid #9cd6c9;width: 100%;margin: 10px 0;"></div> </div> <div class="row" style="margin-left: -15px;margin-right: -15px;"> <p class="bold_font" style="font-family: avalonbold;font-size: 16.9pt;font-weight: 800;margin: 0;margin-bottom:10px;">Now that you\'ve decided to be associated with us, <br/>let us assure you of one thing, GENUINE RESULTS.</p> <div class="green_row" style="border-bottom: 2px solid #9cd6c9;width: 100%;margin: 10px 0;"></div> </div> <div class="row" style="margin-left: -15px;margin-right: -15px;"> <p class="common_content" style="font-family: avalonregular;font-size: 18px;line-height: 25px;">Customer satisfaction for us is of utmost importance. So expect <br/>zero compromises in the quality of our services! Besides that, <br/>you can now happily sift through the best of restaurants, look <br/>for salons and spas, spot that shopping outlet and automobile <br/>showroom! </p> </div> <div class="row" style="margin-left: -15px;margin-right: -15px;"> <p class="common_content" style="font-family: avalonregular;font-size: 18px;line-height: 25px;">Seriously, we are nothing less than a parallel of Willy Wonka\'s <br/>Chocolate factory, only we get you a myriad of options! </p> </div> <div class="row" style="margin-left: -15px;margin-right: -15px;"> <p class="common_content" style="font-family: avalonregular;font-size: 18px;line-height: 25px;">Your username : ##username##</p> <p class="common_content" style="font-family: avalonregular;font-size: 18px;line-height: 25px;">Your Password : ##password##</p> <p class="common_content" style="font-family: avalonregular;font-size: 18px;line-height: 25px;">Active Your Account : <a href="##link##">Click Here</a></p> </div> <div class="row" style="margin-left: -15px;margin-right: -15px;"> <p class="bold_font" style="font-family: avalonbold;font-size: 16.9pt;font-weight: 800;margin: 0;margin-bottom:10px;">Wishing you a happy time </p> </div> <div class="row" style="margin-left: -15px;margin-right: -15px;"> <p class="thanks" style="font-family: bakery;font-size: 40pt;margin: 10px 0;">Team Faagio</p> </div> </div> <br/> <br/> <br/> <br/> <div class="col-sm-3" style="min-height: 1px;position: relative;width:25%;float:left;"> </div> <div class="col-sm-9" style="min-height: 1px;position: relative;width:75%;float:left;"> <div class="row" style="margin-left: -15px;margin-right: -15px;"> <p class="footer_add" style="font-size:11px;margin:5px 0px;">For help, please email us at <a style="color:#595655;font-weight:bold;" href="mailto:feedback@faagio.com">feedback@faagio.com</a></p> </div> </div> <div class="col-sm-3" style="min-height: 1px;position: relative;width:25%;float:left;"> </div> <div class="col-sm-9" style="min-height: 1px;position: relative;width:75%;float:left;"> <div class="row" style="margin-left: -15px;margin-right: -15px;"> <p class="footer_add" style="font-size:11px;margin:5px 0px;font-weight:bold;">Unsubscribe from these emails | <a style="color:#595655;font-weight:bold;" href="#">Notification Settings</a></p> </div> </div> <div class="col-sm-3" style="min-height: 1px;position: relative;width:25%;float:left;"> </div> <div class="col-sm-9" style="min-height: 1px;position: relative;width:75%;float:left;"> <div class="row" style="margin-left: -15px;margin-right: -15px;"> <p class="footer_add" style="font-size:11px;margin:5px 0px;">&copy; Faagio - 403, D-23, 100 Foot Road, Chattarpur Hills, Chattarpur, New Delhi- 74</p> </div> </div></div> </div></body></html>'
        }
        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                console.log(false);
            }else
                console.log(true);
        });
    }
}
