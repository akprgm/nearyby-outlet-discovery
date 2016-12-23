var mongoose = require('mongoose');
var redis = require('redis');
var async = require('async');
var request = require('request');
var env = require('../../env/development');
var validator = require('../validator');
var utility = require('../utility');
var OutletModel = mongoose.model('outlet');
var BookMarkModel = mongoose.model('bookMark');
var OUTLET = {
    searchOutlets: function searchOutlets(query,user_id,latitude,longitude,response){
        async.waterfall([
            function(callback){
                async.parallel([
                    function(innerCallback){
                         OutletModel.aggregate(query,function(err,result){
                           if(!err && result){
                                innerCallback(null,result)
                            }else{
                                utility.internalServerError(response);
                            }
                        });
                    },
                    function(innerCallback){
                        OUTLET.findBookMarkOutlet(user_id,function(result){
                            innerCallback(null,result);
                        });
                    }
                ],function(err,result){
                    if(!err && result.length){
                        callback(null,result);
                    }else{
                        utility.internalServerError(response);
                    }
                });
            },
            function(result,callback){
                var outlets = result[0];
                var bookMarks = result[1];
                OUTLET.checkOutlet(outlets,bookMarks,latitude,longitude,function(result){
                    callback(null,result);
                });
            }
        ],function(err,result){
            if(err){
                utility.internalServerError(response);
            }else{
                utility.successDataRequest(result,response);
            }
        });
    },
    checkOutlet: function checkOutlet(outlets,bookMarks,latitude,longitude,checkCallback){
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
                //finding distance for outlet
                let outletLatitude = value.location[1];
                let outletLongitude = value.location[0];
                let distance = (6371*2*Math.asin(Math.sqrt(Math.pow(Math.sin((latitude - outletLatitude)*Math.PI/180/2),2) + Math.cos(latitude*Math.PI/180)*Math.cos(outletLatitude*Math.PI/180)*Math.pow(Math.sin((longitude -outletLongitude)*Math.PI/180/2),2))));
                value.distance = distance;
                if(!bookMarks){
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
    searchString: function(dataObject, response){
        if((validator.validateObjectId(dataObject.user_id)) && (typeof(dataObject.search_string) == 'string') && (validator.validateOffset(dataObject.offset)) &&  validator.validateLatitudeLongitude(parseFloat(dataObject.latitude),parseFloat(dataObject.longitude))){
            async.waterfall([
                function(callback){
                    async.parallel([
                        function(innerCallback){
                            let offset = parseInt(dataObject.offset);
                            OutletModel.aggregate([
                                {"$match":{"$text":{"$search":dataObject.search_string}}},{"$project":{"locality":1,"cover_image":1,"name":1,"star":1,"cost_rating":1,"location":1,"contacts":1}},{"$sort":{"score":{"$meta":"textScore"}}},{"$skip":offset},{"$limit":10}
                            ],function(err,result){
                                if(!err && result){
                                    innerCallback(null,result)
                                }else{
                                    utility.internalServerError(response);
                                }
                            });
                        },
                        function(innerCallback){
                            OUTLET.findBookMarkOutlet(dataObject.user_id,function(result){
                                innerCallback(null,result);
                            });
                        }
                    ],function(err,result){
                        if(!err && result.length){
                            callback(null,result);
                        }else{
                            utility.internalServerError(response);
                        }
                    });
                },
                function(result,callback){
                    var outlets = result[0];
                    var bookMarks = result[1];
                    OUTLET.checkOutlet(outlets,bookMarks,dataObject.latitude,dataObject.longitude,function(result){
                        callback(null,result);
                    });
                }
            ],function(err,result){
                if(err){
                    console.log(err);
                    utility.internalServerError(response);
                }else{
                    utility.successDataRequest(result,response);
                }
            });
        }else{
            utility.badRequest(response);
        }
    },
    filterSearch: function(dataObject,response){
        if(validator.validateObjectId(dataObject.user_id) && (typeof(dataObject.search_string) == 'string') && (typeof(dataObject.category) == 'string') && validator.validateOffset(dataObject.offset) &&  validator.validateLatitudeLongitude(parseFloat(dataObject.latitude),parseFloat(dataObject.longitude))){
            let category = dataObject.category;
            let offset = parseInt(dataObject.offset);
            let obj;
            let query = new Array();
            let project ={
                $project:{
                    locality:1,
                    cover_image:1,
                    name:1,
                    star:1,
                    cost_rating:1,
                    location:1,
                    contacts:1
                }
            };
            let sort = {
                $sort: {
                    score:{
                        $meta:"textScore"
                    }
                }
            };
            let skip = {
                $skip: offset
            }
            let limit = {
                $limit: 10
            }
            let match = {
                $match:{
                    $and:[
                    {$text:{
                        $search:dataObject.search_string
                    }}]

                }
            }
            if(typeof(dataObject.cost_rating) == 'object' && dataObject.cost_rating.length>0){
                let cost_rating = [parseInt(dataObject.cost_rating[0]),parseInt(dataObject.cost_rating[1])]; 
                if(cost_rating[0]>=0 && cost_rating[1]<=5){
                    match.$match.$and.push({cost_rating:{
                            $lte: cost_rating[1],
                            $gte: cost_rating[0]
                        }
                    });
                }
            }
            if(typeof(dataObject.outlet_type) == 'object' && dataObject.outlet_type.length>0){
                let checkFlag = true;
                async.forEachOf(dataObject.outlet_type,function(value,key,callback){
                    if(value.length<=0){
                        checkFlag = false;
                        callback(null);
                    }
                });
                if(checkFlag){
                    match.$match.$and.push({outlet_type:{
                        $all:dataObject.outlet_type
                    }});
                }
            }
            if(typeof(dataObject.outlet_accept) == 'object' && dataObject.outlet_accept.length>0){
                let checkFlag = true;
                async.forEachOf(dataObject.outlet_accept,function(value,key,callback){
                    if(value.length<=0){
                        checkFlag = false;
                        callback(null);
                    }
                });
                if(checkFlag){
                    match.$match.$and.push({outlet_accept:{
                        $all:dataObject.outlet_accept
                    }});
                }
            }
            if(typeof(dataObject.gender) == 'object' && dataObject.gender.length>0){
                let checkFlag = true;
                async.forEachOf(dataObject.gender,function(value,key,callback){
                    if(value.length<=0){
                        checkFlag = false;
                        callback(null);
                    }
                });
                if(checkFlag){
                    match.$match.$and.push({gender: {
                        $all:dataObject.gender
                    }});
                }
            }
            if(typeof(dataObject.labels) == 'object' && dataObject.labels.length>0){
                async.forEachOf(dataObject.labels,function(value,key){
                    if(value.length>0){
                        let field = "labels."+value;
                        obj = {}
                        obj[field] = "Yes";
                        match.$match.$and.push(obj);                                                        
                    }
                }); 
            }
            switch(category){
                case 'book':
                        match.$match.category = category;
                        query.push(match,project,sort,skip,limit);
                        OUTLET.searchOutlets(query,dataObject.user_id,dataObject.latitude,dataObject.longitude,response);
                    break;
                case 'cloth':
                        match.$match.category = category;
                        query.push(match,project,sort,skip,limit);
                        OUTLET.searchOutlets(query,dataObject.user_id,dataObject.latitude,dataObject.longitude,response);                            
                    break;
                case 'consumer':
                        match.$match.category = category;
                        query.push(match,project,sort,skip,limit);
                        OUTLET.searchOutlets(query,dataObject.user_id,dataObject.latitude,dataObject.longitude,response);                            
                    break;
                case 'watch':
                        match.$match.category = category;
                        query.push(match,project,sort,skip,limit);
                        OUTLET.searchOutlets(query,dataObject.user_id,dataObject.latitude,dataObject.longitude,response);
                    break;
                default:
                    utility.badRequest(response);
            }
        }else{
            utility.badRequest(response);
        }    
    }
}