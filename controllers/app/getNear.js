var mongoose = require('mongoose');
var redis = require('redis');
var async = require('async');
var request = require('request');
var env = require('../../env/development');
var validator = require('../validator');
var utility = require('../utility');
var OutletModel = mongoose.model('outlet');
var BookMarkModel = mongoose.model('bookMark');;
var OUTLET = {
    checkOutlet: function checkOutlet(outlets,bookMarks,checkCallback){
        async.map(outlets,function(value,valueCallBack){
            let cover_image = value.cover_image;
            let category = value.category;
            let image_path = env.app.gallery_url+category+"/cover_images/"+cover_image;
            let image_access_path = env.app.gallery_url+category+"/cover_images/"+cover_image;            
            utility.checkImage(image_path,image_access_path,function(new_image_url){
                if(new_image_url){
                    value.cover_image = new_image_url;
                }else{
                    value.cover_image = env.app.gallery_url+"/s.jpg";
                }
                if(!bookMarks.length){
                    value.bookMark = false;
                }
                async.map(bookMarks,function(bookmark,bookMarkCallBack){
                    let flag = false;
                    if(JSON.stringify(bookmark.outlet_id) === JSON.stringify(value._id)){
                        value.bookMark = true;
                        flag = true;
                        bookMarkCallBack(null);  
                    }else{
                        value.bookMark = false;
                    }
                    if(!flag){
                        bookMarkCallBack(null);                    
                    }
                });
                valueCallBack(null,value);
            });
        },function(err,result){
            if(err){
                checkCallback(null);
            }else{
                checkCallback(result)
            }
        });
    },
    findBookMarkOutlet: function findBookMarkOutlet(user_id,bookMarkCallBack){
        BookMarkModel.find({"user_id":user_id},{"outlet_id":1},function(err,result){
            if(!err){
                bookMarkCallBack(result);
            }else{
                bookMarkCallBack(null);
            }
       }); 
    }
}
module.exports = {
    getNearOutlets: function getNearOutlets(dataObject, response){       
        if(validator.validateObjectId(dataObject.user_id) && validator.validateLatitudeLongitude(parseFloat(dataObject)),parseFloat(dataObject.longitude)){
            let location = [parseFloat(dataObject.longitude),parseFloat(dataObject.latitude)];
            let baseUrl = env.app.url;
            async.parallel([
                function(callback){
                    let bookUrl = baseUrl + "getNearBookOutlets?access_token="+dataObject.access_token+"&user_id="+dataObject.user_id+"&longitude="+dataObject.longitude+"&latitude="+dataObject.latitude+"&minDistance="+dataObject.minDistance;
                    request(bookUrl,function(err,res,body){
                        if(!err && res.statusCode == 200){
                            let data = JSON.parse(body);
                            callback(null,data.message);
                        }else{
                            utility.internalServerError(response);
                        }
                    });
                },
                function(callback){
                    let clothUrl = baseUrl + "getNearClothOutlets?access_token="+dataObject.access_token+"&user_id="+dataObject.user_id+"&longitude="+dataObject.longitude+"&latitude="+dataObject.latitude+"&minDistance="+dataObject.minDistance;
                    request(clothUrl,function(err,res,body){
                        if(!err && res.statusCode == 200){
                            let data = JSON.parse(body);
                            callback(null,data.message);
                        }else{
                            utility.internalServerError(response);
                        }
                    });
                },
                function(callback){
                    let consumerUrl = baseUrl + "getNearConsumerOutlets?access_token="+dataObject.access_token+"&user_id="+dataObject.user_id+"&longitude="+dataObject.longitude+"&latitude="+dataObject.latitude+"&minDistance="+dataObject.minDistance;
                    request(consumerUrl,function(err,res,body){
                        if(!err && res.statusCode == 200){
                            let data = JSON.parse(body);
                            callback(null,data.message);
                        }else{
                            utility.internalServerError(response);
                        }
                    });
                },
                function(callback){
                    let watchUrl = baseUrl + "getNearWatchOutlets?access_token="+dataObject.access_token+"&user_id="+dataObject.user_id+"&longitude="+dataObject.longitude+"&latitude="+dataObject.latitude+"&minDistance="+dataObject.minDistance;
                    request(watchUrl,function(err,res,body){
                        if(!err && res.statusCode == 200){
                            let data = JSON.parse(body);
                            callback(null,data.message);
                        }else{
                            utility.internalServerError(response);
                        }
                    });
                }
            ],function(err,result){
                if(!err && result.length>0){
                    var jsonObject = {
                        status: true,
                        book: result[0],
                        cloth: result[1],
                        consumer: result[2],
                        watch: result[3]
                    }
                    response.send(jsonObject);
                }else{
                    utility.internalServerError(response);
                }
            });           
        }else{
            utility.badRequest(response);
        }
    },
    getNearClothOutlets: function getNearClothOutlets(dataObject, response){
        if((validator.validateObjectId(dataObject.user_id)) && (validator.validateLatitudeLongitude(parseFloat(dataObject.latitude)),parseFloat(dataObject.longitude)) && (typeof(parseFloat(dataObject.minDistance))=='number')){
            async.waterfall([
                function(callback){
                    async.parallel([
                        function(innerCallback){
                            let location = [parseFloat(dataObject.longitude),parseFloat(dataObject.latitude)];
                            let minDistance = parseFloat(dataObject.minDistance)*1000+1;
                            OutletModel.aggregate([
                                {"$geoNear":{"near":{"type":"point","coordinates":location},"spherical":true,"query":{"category":"cloth"},"distanceField":"distance","minDistance":minDistance,"distanceMultiplier":0.001}},{"$project":{"category":1,"locality":1,"cover_image":1,"name":1,"star":1,"location":1,"distance":1,"contacts":1,"discount":1}},{"$sort":{"distance":1}},{"$limit":10}
                            ],function(err,result){
                                if(!err && result){
                                    innerCallback(null,result);
                                }else{
                                    utility.internalServerError(response);
                                }            
                            });
                        },
                        function(innerCallback){
                            OUTLET.findBookMarkOutlet(dataObject.user_id,function(result){
                                innerCallback(null,result);
                            })
                        }
                    ],function(err,result){
                        if(!err && result.length){
                            callback(null,result);
                        }else{
                            utility.internalServerError(response);
                        }
                    })
                },
                function(result,callback){
                    var outlets = result[0];
                    var bookMarks = result[1];
                    OUTLET.checkOutlet(outlets,bookMarks,function(result){
                        callback(null,result);
                    })
                }
            ],function(err,result){
                if(err){
                    utility.internalServerError(response);
                }else{
                    utility.successDataRequest(result,response);
                }
            });
        }else{  
            utility.badRequest(response);
        }
    },
    getNearBookOutlets: function getNearBookOutlets(dataObject, response){
      if((validator.validateObjectId(dataObject.user_id)) && (validator.validateLatitudeLongitude(parseFloat(dataObject.latitude)),parseFloat(dataObject.longitude)) && (typeof(parseFloat(dataObject.minDistance))=='number')){
            async.waterfall([
                function(callback){
                    async.parallel([
                        function(innerCallback){
                            let location = [parseFloat(dataObject.longitude),parseFloat(dataObject.latitude)];
                            let minDistance = parseFloat(dataObject.minDistance)*1000+1;
                            OutletModel.aggregate([
                                {"$geoNear":{"near":{"type":"point","coordinates":location},"spherical":true,"query":{"category":"book"},"distanceField":"distance","minDistance":minDistance,"distanceMultiplier":0.001}},{"$project":{"category":1,"locality":1,"cover_image":1,"name":1,"star":1,"location":1,"distance":1,"contacts":1,"discount":1}},{"$sort":{"distance":1}},{"$limit":10}
                            ],function(err,result){
                                if(!err && result){
                                    innerCallback(null,result);
                                }else{
                                    utility.internalServerError(response);
                                }            
                            });
                        },
                        function(innerCallback){
                            OUTLET.findBookMarkOutlet(dataObject.user_id,function(result){
                                innerCallback(null,result);
                            })
                        }
                    ],function(err,result){
                        if(!err && result.length){
                            callback(null,result);
                        }else{
                            utility.internalServerError(response);
                        }
                    })
                },
                function(result,callback){
                    var outlets = result[0];
                    var bookMarks = result[1];
                    OUTLET.checkOutlet(outlets,bookMarks,function(result){
                        callback(null,result);
                    })
                }
            ],function(err,result){
                if(err){
                    utility.internalServerError(response);
                }else{
                    utility.successDataRequest(result,response);
                }
            });
        }else{  
            utility.badRequest(response);
        }
    },
    getNearConsumerOutlets: function getNearConsumerOutlets(dataObject, response){
        if((validator.validateObjectId(dataObject.user_id)) && (validator.validateLatitudeLongitude(parseFloat(dataObject.latitude)),parseFloat(dataObject.longitude)) && (typeof(parseFloat(dataObject.minDistance))=='number')){
            async.waterfall([
                function(callback){
                    async.parallel([
                        function(innerCallback){
                            let location = [parseFloat(dataObject.longitude),parseFloat(dataObject.latitude)];
                            let minDistance = parseFloat(dataObject.minDistance)*1000+1;
                            OutletModel.aggregate([
                                {"$geoNear":{"near":{"type":"point","coordinates":location},"spherical":true,"query":{"category":"consumer"},"distanceField":"distance","minDistance":minDistance,"distanceMultiplier":0.001}},{"$project":{"category":1,"locality":1,"cover_image":1,"name":1,"star":1,"location":1,"distance":1,"contacts":1,"discount":1}},{"$sort":{"distance":1}},{"$limit":10}
                            ],function(err,result){
                                if(!err && result){
                                    innerCallback(null,result);
                                }else{
                                    utility.internalServerError(response);
                                }            
                            });
                        },
                        function(innerCallback){
                            OUTLET.findBookMarkOutlet(dataObject.user_id,function(result){
                                innerCallback(null,result);
                            })
                        }
                    ],function(err,result){
                        if(!err && result.length){
                            callback(null,result);
                        }else{
                            utility.internalServerError(response);
                        }
                    })
                },
                function(result,callback){
                    var outlets = result[0];
                    var bookMarks = result[1];
                    OUTLET.checkOutlet(outlets,bookMarks,function(result){
                        callback(null,result);
                    })
                }
            ],function(err,result){
                if(err){
                    utility.internalServerError(response);
                }else{
                    utility.successDataRequest(result,response);
                }
            });
        }else{  
            utility.badRequest(response);
        }
    },
    getNearWatchOutlets: function getNearWatchOutlets(dataObject, response){
        if((validator.validateObjectId(dataObject.user_id)) && (validator.validateLatitudeLongitude(parseFloat(dataObject.latitude)),parseFloat(dataObject.longitude)) && (typeof(parseFloat(dataObject.minDistance))=='number')){
            async.waterfall([
                function(callback){
                    async.parallel([
                        function(innerCallback){
                            let location = [parseFloat(dataObject.longitude),parseFloat(dataObject.latitude)];
                            let minDistance = parseFloat(dataObject.minDistance)*1000+1;
                            OutletModel.aggregate([
                                {"$geoNear":{"near":{"type":"point","coordinates":location},"spherical":true,"query":{"category":"watch"},"distanceField":"distance","minDistance":minDistance,"distanceMultiplier":0.001}},{"$project":{"category":1,"locality":1,"cover_image":1,"name":1,"star":1,"location":1,"distance":1,"contacts":1,"discount":1}},{"$sort":{"distance":1}},{"$limit":10}
                            ],function(err,result){
                                if(!err && result){
                                    innerCallback(null,result);
                                }else{
                                    utility.internalServerError(response);
                                }            
                            });
                        },
                        function(innerCallback){
                            OUTLET.findBookMarkOutlet(dataObject.user_id,function(result){
                                innerCallback(null,result);                               
                            })
                        }
                    ],function(err,result){
                        if(!err && result.length){
                            callback(null,result);
                        }else{
                            utility.internalServerError(response);
                        }
                    })
                },
                function(result,callback){
                    var outlets = result[0];
                    var bookMarks = result[1];
                    OUTLET.checkOutlet(outlets,bookMarks,function(result){
                        callback(null,result);
                    })
                }
            ],function(err,result){
                if(err){
                    utility.internalServerError(response);
                }else{
                    utility.successDataRequest(result,response);
                }
            });
        }else{  
            utility.badRequest(response);
        }
    }
}
