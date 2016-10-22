var mongoose = require('mongoose');
var redis = require('redis');
var models = require('../../models/appModel');
var validator = require('../validator');
var utility = require('../utility');
var BookMarkModel = models.bookMark;
var BookMark = new BookMarkModel();
module.exports = {
    bookMarkOutlet: function bookMark(dataObject,response){
        if(validator.validateObjectId(dataObject.user_id) && validator.validateObjectId(dataObject.outlet_id) && validator.validateCategory(dataObject.category)){
            var bookMarkKey = dataObject.user_id+":bookmarks";
            BookMark.remove({user_id:dataObject.user_id,outlet_id:dataObject.outlet_id},function(err,result){
                if(err){
                    utility.internalServerError(response);
                }
                if(!err && result.result.n>0){
                    BookMark.find({user_id:dataObject.user_id},function(err,result){
                        if(!err && result){
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
                    let bookMark = new BookMark(obj);
                    bookMark.save(function(err,result){ 
                        if(!err && result){
                            BookMark.find({user_id:dataObject.user_id},function(err,result){
                                if(!err && result){
                                    utility.redisSaveKey(bookMarkKey,JSON.stringify(result));
                                }else{}
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
       if(validator.validateObjectId(dataObject.user_id)){
            var bookMarkKey = dataObject.user_id+":bookmarks";
            utility.redisFindKey(bookMarkKey,function(bookMarks){
                if(bookMarks = JSON.parse(bookMarks)){//looking in redis cache store
                    utility.successDataRequest(bookMarks,response);//sending success response to client  
                }else{//looking in mongodb
                    BookMark.find({user_id:dataObject.user_id},function(err,result){
                        if(!err && result.length>0){
                            utility.redisSaveKey(bookMarkKey,JSON.stringify(result));
                            utility.successDataRequest(result,response);//sending success response to client                              
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