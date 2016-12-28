var mongoose = require('mongoose');
var redis = require('redis');
var async = require('async');
var validator = require('../validator');
var utility = require('../utility');
var BookMarkModel = mongoose.model('bookMark');
module.exports = {
    bookMarkOutlet: function bookMark(dataObject,response){
        if(validator.validateObjectId(dataObject.user_id) && validator.validateObjectId(dataObject.outlet_id) && validator.validateCategory(dataObject.category)){
            let bookMarkKey = dataObject.user_id+":bookmarks";
            let user_id = mongoose.Types.ObjectId(dataObject.user_id);            
            BookMarkModel.remove({"$and":[{user_id:dataObject.user_id},{outlet_id:dataObject.outlet_id}]},function(err,result){
                if(err){
                    utility.internalServerError(response);
                }else if(!err && result.result.n>0){
                    BookMarkModel.aggregate([{"$lookup":{"from":"outlets","localField":"outlet_id","foreignField":"_id","as":"outlet_info"}},{"$match":{"$and":[{"user_id":user_id},{"outlet_info":{"$ne":[]}}]}},{"$project":{"_id":0,"user_id":1,"date":1,"outlet_info._id":1,"outlet_info.name":1,"outlet_info.cover_image":1,"outlet_info.locality":1}},{"$sort":{"date":-1}}],function(err,result){
                        if(!err && result){
                            utility.outletDefaultCoverImage(result);
                            utility.redisSaveKey(bookMarkKey,JSON.stringify(result));
                        }else{}
                    });
                    utility.successRequest(response);
                }else{
                    let obj = {
                        user_id: dataObject.user_id,
                        outlet_id: dataObject.outlet_id,
                        date: (new Date).getTime(),
                        category: dataObject.category
                    }
                    let bookMark = new BookMarkModel(obj);
                    bookMark.save(function(err,result){ 
                        if(!err && result){
                            BookMarkModel.aggregate([{"$lookup":{"from":"outlets","localField":"outlet_id","foreignField":"_id","as":"outlet_info"}},{"$match":{"$and":[{"user_id":user_id},{"outlet_info":{"$ne":[]}}]}},{"$project":{"_id":0,"user_id":1,"date":1,"outlet_info._id":1,"outlet_info.name":1,"outlet_info.cover_image":1,"outlet_info.locality":1}},{"$sort":{"date":-1}}],function(err,result){
                                if(!err && result){
                                    console.log(result);
                                    utility.redisSaveKey(bookMarkKey,JSON.stringify(result));
                                }
                            });
                            utility.successRequest(response);
                        }else{
                            utility.internalServerError(response)
                        }
                    });
                }
            });
        }else{
            utility.badRequest(response);
        }
    },
    getBookMarks: function getBookMark(dataObject,response){
       if(validator.validateObjectId(dataObject.user_id) && validator.validateOffset(dataObject.offset)){
            let bookMarkKey = dataObject.user_id+":bookmarks";
            let offset = parseInt(dataObject.offset);
            utility.redisFindKey(bookMarkKey,function(bookMarks){
                if(bookMarks = JSON.parse(bookMarks)){//looking in redis cache store
                    if(bookMarks.length>0){
                        utility.successDataRequest(bookMarks.slice(offset,offset+10),response);//sending success response to client                      
                    }else{
                        utility.failureRequest(response);
                    }
                }else{//looking in mongodb
                    let user_id = mongoose.Types.ObjectId(dataObject.user_id);
                    BookMarkModel.aggregate([{"$lookup":{"from":"outlets","localField":"outlet_id","foreignField":"_id","as":"outlet_info"}},{"$match":{"$and":[{"user_id":user_id},{"outlet_info":{"$ne":[]}}]}},{"$project":{"_id":0,"user_id":1,"date":1,"outlet_info._id":1,"outlet_info.name":1,"outlet_info.cover_image":1,"outlet_info.locality":1,"outlet_info.category":1}},{"$sort":{"date":-1}}],function(err,result){
                        if(!err && result.length>0){
                            utility.outletDefaultCoverImage(result);
                            utility.redisSaveKey(bookMarkKey,JSON.stringify(result));                            
                            utility.successDataRequest(result.slice(offset,offset+10),response);//sending success response to client                                         
                        }else{
                            utility.failureRequest(response);
                        }
                    }); 
                }
            });
       }else{
           utility.badRequest(response);
       }
    }
}