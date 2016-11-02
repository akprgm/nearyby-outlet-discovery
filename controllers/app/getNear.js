var mongoose = require('mongoose');
var redis = require('redis');
var async = require('async');
var request = require('request');
var env = require('../../env/development');
var models = require('../../models/appModel');
var validator = require('../validator');
var utility = require('../utility');
var OutletModel = models.outlet;
var Outlet = new OutletModel;
module.exports = {
    getNearOutlets: function getNearOutlets(dataObject, response){       
        if(validator.validateLatitudeLongitude(parseFloat(dataObject)),parseFloat(dataObject.longitude)){
            let location = [parseFloat(dataObject.longitude),parseFloat(dataObject.latitude)];
            let baseUrl = env.app.url;
            async.parallel([
                function(callback){
                    let bookUrl = baseUrl + "getNearBookOutlets?access_token="+dataObject.access_token+"&longitude="+dataObject.longitude+"&latitude="+dataObject.latitude+"&minDistance="+dataObject.minDistance;
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
                    let clothUrl = baseUrl + "getNearClothOutlets?access_token="+dataObject.access_token+"&longitude="+dataObject.longitude+"&latitude="+dataObject.latitude+"&minDistance="+dataObject.minDistance;
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
                    let consumerUrl = baseUrl + "getNearConsumerOutlets?access_token="+dataObject.access_token+"&longitude="+dataObject.longitude+"&latitude="+dataObject.latitude+"&minDistance="+dataObject.minDistance;
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
                    let watchUrl = baseUrl + "getNearWatchOutlets?access_token="+dataObject.access_token+"&longitude="+dataObject.longitude+"&latitude="+dataObject.latitude+"&minDistance="+dataObject.minDistance;
                    request(watchUrl,function(err,res,body){
                        if(!err && res.statusCode == 200){
                            let data = JSON.parse(body);
                            callback(null,data.message);
                        }else{
                            utility.internalServerError(response);
                        }
                    });
                }
            ],function(err,results){
                if(!err && results.length>0){
                    var jsonObject = {
                        status: true,
                        book: results[0],
                        cloth: results[1],
                        consumer: results[2],
                        watch: results[3]
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
        if(validator.validateLatitudeLongitude(parseFloat(dataObject.latitude)),parseFloat(dataObject.longitude) && typeof(parseFloat(dataObject.minDistance))=='number'){
            let location = [parseFloat(dataObject.longitude),parseFloat(dataObject.latitude)];
            let minDistance = parseFloat(dataObject.minDistance)*1000+1;
            Outlet.aggregate([{"$geoNear":{"near":{"type":"point","coordinates":location},"spherical":true,"query":{"category":"cloth"},"distanceField":"distance","minDistance":minDistance,"distanceMultiplier":0.001}},{"$project":{"locality":1,"cover_image":1,"name":1,"location":1,"distance":1,"contacts":1}},{"$sort":{"distance":1}},{"$limit":10}],function(err,results){
                if(err){
                    utility.internalServerError(response);
                }else{
                    utility.successDataRequest(results,response);                
                }
            });            
        }else{  
            utility.badRequest(response);
        }
    },
    getNearBookOutlets: function getNearBookOutlets(dataObject,response){
       if(validator.validateLatitudeLongitude(parseFloat(dataObject.latitude)),parseFloat(dataObject.longitude) && typeof(parseFloat(dataObject.minDistance))=='number'){
            let location = [parseFloat(dataObject.longitude),parseFloat(dataObject.latitude)];
            console.log(location);
            let minDistance = parseFloat(dataObject.minDistance)*1000+1;
            Outlet.aggregate([{"$geoNear":{"near":{"type":"point","coordinates":location},"spherical":true,"query":{"category":"book"},"distanceField":"distance","minDistance":minDistance,"distanceMultiplier":0.001}},{"$project":{"locality":1,"cover_image":1,"name":1,"location":1,"distance":1,"contacts":1}},{"$limit":10}],function(err,results){
                if(err){
                    utility.internalServerError(response);
                }else{
                    utility.successDataRequest(results,response);                
                }
            });            
        }else{  
            utility.badRequest(response);
        }
    },
    getNearConsumerOutlets: function getNearConsumerOutlets(dataObject,response){
        if(validator.validateLatitudeLongitude(parseFloat(dataObject.latitude)),parseFloat(dataObject.longitude) && typeof(parseFloat(dataObject.minDistance))=='number'){
            let location = [parseFloat(dataObject.longitude),parseFloat(dataObject.latitude)];
            let minDistance = parseFloat(dataObject.minDistance)*1000+1;
            Outlet.aggregate([{"$geoNear":{"near":{"type":"point","coordinates":location},"spherical":true,"query":{"category":"consumer"},"distanceField":"distance","minDistance":minDistance,"distanceMultiplier":0.001}},{"$project":{"locality":1,"cover_image":1,"name":1,"location":1,"distance":1,"contacts":1}},{"$sort":{"distance":1}},{"$limit":10}],function(err,results){
                if(err){
                    utility.internalServerError(response);
                }else{
                    utility.successDataRequest(results,response);                
                }
            });            
        }else{  
            utility.badRequest(response);
        }
    },
    getNearWatchOutlets: function getNearWatchOutlets(dataObject,response){
        if(validator.validateLatitudeLongitude(parseFloat(dataObject.latitude)),parseFloat(dataObject.longitude) && typeof(parseFloat(dataObject.minDistance))=='number'){
            let location = [parseFloat(dataObject.longitude),parseFloat(dataObject.latitude)];
            let minDistance = parseFloat(dataObject.minDistance)*1000+1;
            Outlet.aggregate([{"$geoNear":{"near":{"type":"point","coordinates":location},"spherical":true,"query":{"category":"watch"},"distanceField":"distance","distanceMultiplier":0.001,"minDistance":minDistance}},{"$project":{"locality":1,"cover_image":1,"name":1,"location":1,"distance":1,"contacts":1}},{"$sort":{"distance":1}},{"$limit":10}],function(err,results){
                if(err){
                    utility.internalServerError(response);
                }else{
                    utility.successDataRequest(results,response);                
                }
            });            
        }else{  
            utility.badRequest(response);
        }
    }
}
