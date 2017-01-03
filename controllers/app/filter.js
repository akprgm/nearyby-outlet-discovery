var mongoose = require('mongoose');
var redis = require('redis');
var async = require('async');
var request = require('request');
var env = require('../../env/development');
var validator = require('../validator');
var utility = require('../utility');
var OutletModel = mongoose.model('outlet');
var BookMarkModel = mongoose.model('bookMark');
var FILTER = {
    checkOutlet: function checkOutlet(outlets,bookMarks,checkCallback){
        async.map(outlets,function(value,valueCallBack){
            let cover_image = value.cover_image;
            let category = value.category;
            let image_path = env.app.gallery_directory+category+"/cover_images_500/"+cover_image;
            let image_access_path = env.app.gallery_url+category+"/cover_images_500/"+cover_image;            
            utility.checkImage(image_path,image_access_path,function(new_image_url){
                if(new_image_url){
                    value.cover_image = new_image_url;
                }else{
                    value.cover_image = env.app.gallery_url+"images/default_shopping_"+category+Math.floor(Math.random() * 2) + 1  .jpg";
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
    filterOutlets: function filterOutlets(query,user_id,response){
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
                        BookMarkModel.find({"user_id":user_id},{"outlet_id":1},function(err,result){
                            if(!err){
                                innerCallback(null,result);
                            }else{
                                innerCallback(null);
                            }
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
                FILTER.checkOutlet(outlets,bookMarks,function(result){
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
    }   
}
module.exports = {
    filterOutlets: function(dataObject,response){
        if(validator.validateObjectId(dataObject.user_id) && (typeof(dataObject.category) == 'string') && validator.validateOffset(dataObject.offset)){
            let category = dataObject.category;
            let offset = parseInt(dataObject.offset);
            let query = new Array();
            let obj;
            let project ={
                $project:{
                    locality:1,
                    cover_image:1,
                    name:1,
                    location:1,
                    contacts:1,
                    star:1,
                    rating:1,
                    cost_rating:1
                }
            };
            let sort = {
            };
            let skip = {
                $skip: offset
            }
            let limit = {
                $limit: 10
            }
            let match = {
                $match:{
                    $and: new Array()
                }
            }
            if(typeof(dataObject.sort) == 'string'){
                switch(dataObject.sort){
                    case 'cost_ratingHL':
                            sort.$sort ={
                                cost_rating:-1
                            }
                        break;
                    case 'cost_ratingLH':
                            sort.$sort ={
                                cost_rating:1
                            }
                        break;
                    case 'new_arrival':
                            sort.$sort ={
                                date:-1
                            }
                        break;
                    default:
                        sort.$sort ={
                            star:-1
                        }
                }
            }else{
                sort.$sort ={
                    star:-1
                }
            }
            if(typeof(dataObject.category) == 'string'){
                let category = dataObject.category;
                switch(category){
                    case 'book':
                        obj={"category":category}
                        match.$match.$and.push(obj);
                        break;
                    case 'cloth':
                        obj={"category":category}
                        match.$match.$and.push(obj);
                        break;
                    case 'consumer':
                        obj={"category":category}
                        match.$match.$and.push(obj);
                        break;
                    case 'watch':
                        obj={"category":category}
                        match.$match.$and.push(obj);
                        break;
                    default:
                        utility.badRequest(response);
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
                        query.push(match,project,sort,skip,limit);
                        FILTER.filterOutlets(query,dataObject.user_id,response);
                    break;
                case 'cloth':
                        query.push(match,project,sort,skip,limit);
                        FILTER.filterOutlets(query,dataObject.user_id,response);                            
                    break;
                case 'consumer':
                        query.push(match,project,sort,skip,limit);
                        FILTER.filterOutlets(query,dataObject.user_id,response);                            
                    break;
                case 'watch':
                        query.push(match,project,sort,skip,limit);
                        FILTER.filterOutlets(query,dataObject.user_id,response);
                    break;
                default:
                    utility.badRequest(response);
            }
        }else{
            utility.badRequest(response);
        }    
    }
}