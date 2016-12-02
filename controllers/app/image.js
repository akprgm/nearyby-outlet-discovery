var mongoose = require('mongoose');
var redis = require('redis');
var async = require('async');
var models = require('../../models/appModel');
var validator = require('../validator');
var utility = require('../utility');
var env = require('../../env/development');
var ImageModel = mongoose.model('image');
var ImageCommentModel = mongoose.model('imageComment');
var ImageLikeModel = mongoose.model('imageLike');
var UserModel = mongoose.model('user');
module.exports = {
    uploadImage: function uploadImage(dataObject, response){
        if(validator.validateObjectId(dataObject.user_id) && validator.validateObjectId(dataObject.outlet_id) && validator.validateCategory(dataObject.category) && typeof(dataObject.photos)=='string'){
            let dateTime = (new Date).getTime();
            let imageName = dataObject.user_id+"_"+dataObject.category+"_"+dateTime+".jpg";
            let imageObject = {
                user_id: dataObject.user_id,
                outlet_id: dataObject.outlet_id,
                category: dataObject.category,
                image: imageName,
                uploaded_by: "user",
                date: dateTime
            }
            utility.saveImage(imageObject,dataObject.photos,function(bool){
                if(bool){
                    UserModel.update({"_id":dataObject.user_id},{"$inc":{"image_uploaded":1}},function(err,user){});
                    utility.successRequest(response);
                }else{
                    utility.internalServerError(response)
                }
            });
        }else{
            utility.badRequest(response);
        }
    },
    commentImage: function commentImage(dataObject, response){
        if(validator.validateObjectId(dataObject.user_id) && validator.validateObjectId(dataObject.image_id) && typeof(dataObject.comment) == 'string'){
            let obj = {
                user_id: dataObject.user_id,
                image_id: dataObject.image_id,
                comment: dataObject.comment,
                date: (new Date).getTime()
            }
            let comment = new ImageCommentModel(obj);
            comment.save(function(err,result){
                if(!err && result){
                    utility.successRequest(response);
                }else{
                    console.log(err);
                    utility.internalServerError(response);
                }    
            });
        }else{
            utility.badRequest(response);
        }
    },
    likeImage: function likeImage(dataObject, response){
        if(validator.validateObjectId(dataObject.user_id) && validator.validateObjectId(dataObject.image_id)){
            ImageLikeModel.remove({"$and":[{"user_id":dataObject.user_id},{"image_id":dataObject.image_id}]},function(err,result){
                if(!err && result.result.n>0){
                    utility.successRequest(response);
                }else{
                    let obj = {
                        user_id: dataObject.user_id,
                        image_id: dataObject.image_id,
                        date: (new Date).getTime()
                    }
                    let imageLike = new ImageLikeModel(obj);
                    imageLike.save(function(err,result){
                        if(!err && result){
                            utility.successRequest(response);
                        }else{
                            utility.internalServerError(response);
                        }
                    });       
                }
            });
        }else{
            utility.badRequest(response);
        }
    },
    getUserPics: function getUserPics(dataObject, response){ 
        if(validator.validateObjectId(dataObject.user_id)){
            let user_id = mongoose.Types.ObjectId(dataObject.user_id);
            ImageModel.aggregate([{"$match":{"user_id":user_id}},{"$project":{"_id":0,"image_id":"$_id","image":1,"category":1}},{"$sort":{"date":-1}},{"$limit":10}],function(err,result){
                if(!err && result){
                    async.each(result,function(value,callback){
                        utility.checkOutletImage(value.image,value.category,500,function(image){
                            value.image= image;
                            callback();
                        });
                    },function(err){
                        if(!err){
                            utility.successDataRequest(result,response);                                               
                        }else{
                            utility.internalServerError(response);
                        }
                    });
                }else{
                    utility.internalServerError(result,response);
                }
            });
        }else{
            utility.badRequest(response);
        }
        
    },
    getOutletPics: function getOutletPics(dataObject, response){   
        if(validator.validateObjectId(dataObject.outlet_id)){
            let outlet_id = mongoose.Types.ObjectId(dataObject.outlet_id);
            ImageModel.aggregate([{"$match":{"outlet_id":outlet_id}},{"$project":{"_id":0,"image_id":"$_id","image":1,"category":1}},{"$sort":{"date":-1}},{"$limit":10}],function(err,result){
                if(!err && result){ 
                    async.each(result,function(value,callback){
                        utility.checkOutletImage(value.image,value.category,500,function(image){
                            value.image= image;
                            callback();
                        });
                    },function(err){
                        if(!err){
                            utility.successDataRequest(result,response);                                               
                        }else{
                            utility.internalServerError(response);
                        }
                    });
                }else{
                    utility.internalServerError(result,response);
                }
            });
        }else{
            utility.badRequest(response);
        }    
    }
} 