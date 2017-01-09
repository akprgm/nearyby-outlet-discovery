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
var OutletModel = mongoose.model('outlet');
module.exports = {
    uploadImage: function uploadImage(dataObject, response){//upload image
        if(validator.validateObjectId(dataObject.user_id) && validator.validateObjectId(dataObject.outlet_id) && validator.validateCategory(dataObject.category) && typeof(dataObject.photos)=='string'){
            let dateTime = (new Date).getTime();
            let imageName = dataObject.user_id+"_"+dataObject.category+"_"+dateTime;
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
                    utility.internalServerError(response);
                }
            });
        }else{
            utility.badRequest(response);
        }
    },
    commentImage: function commentImage(dataObject, response){//do comments on image
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
    likeImage: function likeImage(dataObject, response){//like image
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
    getUserPics: function getUserPics(dataObject, response){//getting user pics
        if(validator.validateObjectId(dataObject.user_id) && typeof(dataObject.offset)!='undefined'){
            let user_id = mongoose.Types.ObjectId(dataObject.user_id);
            let offset = parseInt(dataObject.offset);
            ImageModel.aggregate([{"$match":{"user_id":user_id}},{"$project":{"_id":0,"image_id":"$_id","image":1,"category":1}},{"$sort":{"date":-1}},{"$skip":offset},{"$limit":10}],function(err,result){
                if(!err && result){
                    let newResult = new Array();
                    async.map(result,function(value,callback){
                        utility.checkOutletImage(value.image,value.category,500,function(image){
                            if(image){
                                value.image = image;
                                newResult.push(value);
                                callback(null,value);
                            }else{
                                value.image = image;
                                callback(null);
                            }
                        });
                    },function(err){
                        if(err){
                            utility.internalServerError(response);
                        }else if(newResult.length){
                            utility.successDataRequest(newResult,response);                                                                           
                        }else{
                            utility.failureRequest(response);
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
    getOutletPics: function getOutletPics(dataObject, response){//getting outlet pics  
        if(validator.validateObjectId(dataObject.outlet_id) && typeof(dataObject.offset)!='undefined'){
            let outlet_id = mongoose.Types.ObjectId(dataObject.outlet_id);
            let offset = parseInt(dataObject.offset);
            ImageModel.aggregate([{"$match":{"outlet_id":outlet_id}},{"$project":{"_id":0,"image_id":"$_id","image":1,"category":1,date:1}},{"$sort":{"date":-1}},{"$skip":offset},{"$limit":10}],function(err,result){
                if(!err && result){
                    let newResult= new Array(); 
                    async.map(result,function(value,callback){
                        utility.checkOutletImage(value.image,value.category,500,function(image){
                            if(image){
                                value.image = image;
                                newResult.push(value);
                                callback(null,value);
                            }else{
                                value.image = image;
                                callback(null);
                            } 
                        });
                    },function(err,result){
                        if(err){
                            utility.internalServerError(response);
                        }else if(newResult.length){
                            utility.successDataRequest(newResult,response);                                                                           
                        }else{
                            utility.failureRequest(response);
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
    getImageDetails: function getImageDetails(dataObject, response){//getting image details
        if(validator.validateObjectId(dataObject.image_id) && validator.validateObjectId(dataObject.user_id)){
            ImageModel.findOne({"_id":dataObject.image_id},{"category":1,"user_id":1,"outlet_id":1,"image":1,"uploaded_by":1,"date":1},function(err,image){
                if(err){
                    utility.internalServerError(response);
                }else if(!err && image){//finding comments and others info about image
                    image = image.toObject();
                    image.image = env.app.gallery_url+image.category+"/gallery/images_1024/"+image.image;
                    async.parallel([
                        function(imageDetailsCallback){//finding total no of likes 
                            ImageLikeModel.find({"image_id":dataObject.image_id},function(err,imageLikes){
                                if(err){
                                    imageDetailsCallback(err);
                                }else{
                                    imageDetailsCallback(null,imageLikes.length);
                                }
                            });
                        },
                        function(imageDetailsCallback){//finding comments count
                            ImageCommentModel.find({"image_id":dataObject.image_id},{"user_id":1,"comment":1,"date":1},{"sort":{"date":-1}},function(err,imageComment){
                                if(err){
                                    imageDetailsCallback(err);
                                }else{  
                                    //manipulating comment getting user pic and name
                                    imageDetailsCallback(null,imageComment.length);
                                }
                            });
                        },
                        function(imageDetailsCallback){//finding comments on image
                            ImageCommentModel.find({"image_id":dataObject.image_id},{"user_id":1,"comment":1,"date":1},{"sort":{"date":-1},"limit":10},function(err,imageComment){
                                if(err){
                                    imageDetailsCallback(err);
                                }else{  
                                    //manipulating comment getting user pic and name
                                    async.map(imageComment,function(value,commentDetailsCallback){
                                        UserModel.findOne({"_id":value.user_id},{"name":1,"image":1},function(err,user){
                                            if(err){
                                                commentDetailsCallback(err);
                                            }else{
                                                value = value.toObject();
                                                value["user_name"] = user.name;
                                                value['user_image'] = (user.image)?(user.image):"defualt image";
                                                commentDetailsCallback(null,value);
                                            }
                                        });
                                    },function(err,imageComment){
                                        if(err){
                                            imageDetailsCallback(err);
                                        }else{
                                            imageDetailsCallback(null,imageComment);
                                        }
                                    });
                                }
                            });
                        },
                        function(imageDetailsCallback){//getting user name and user image
                            if(image.user_id){
                                UserModel.findOne({"_id":image.user_id},{"name":1,"image":1},function(err,user){
                                    if(err){
                                        imageDetailsCallback(err);
                                    }else{  
                                        image.user_name = user.name;
                                        image.user_image = (user.image)?(user.image):env.app.default_profile;
                                        imageDetailsCallback(null);
                                    }
                                });
                            }else{
                                image.user_name = "";
                                image.user_image = "";
                                imageDetailsCallback(null);
                            }
                        },
                        function(imageDetailsCallback){//finding outlet name
                            OutletModel.findOne({"_id":image.outlet_id},{"name":1},function(err, outlet){
                                if(err){
                                    imageDetailsCallback(err);
                                }else{
                                    image.outlet_name = outlet.name;
                                    imageDetailsCallback(null);
                                }
                            }); 
                        },
                        function(imageDetailsCallback){//finding whether user liked or not this image
                            ImageLikeModel.findOne({"$and":[{"image_id":dataObject.image_id},{"user_id":dataObject.user_id}]},function(err,likeCheck){
                                if(err){
                                    imageDetailsCallback(err);
                                }else{
                                    image.liked = true;
                                    imageDetailsCallback(null);
                                }
                            });
                        }
                    ],function(err, result){
                        if(err){
                            utility.internalServerError(response);
                        }else{
                            image.likes = result[0];
                            image.commentCout = result[1];
                            image.comments = result[2];
                            utility.successDataRequest(image,response);
                        }
                    })
                }else{// no image with this id is found
                    utility.failureRequest(response);
                }
            });
        }else{
            //response.send(validator.validateObjectId(dataObject.image_id));
            utility.badRequest(response);
        }
    },
    getCommentsOnImage: function getCommentsOnImage(dataObject, response){//getting comments on images
        if(validator.validateObjectId(dataObject.image_id) && validator.validateOffset(dataObject.offset)){
            let offset = parseInt(dataObject.offset);
            ImageCommentModel.find({"image_id":dataObject.image_id},{"user_id":1,"comment":1,"date":1},{"sort":{"date":-1},"limit":10,"skip":offset},function(err,imageComment){
                if(err){
                    utility.internalServerError(response);
                }else if(!err && imageComment.length){  
                    //manipulating comment getting user pic and name
                    async.map(imageComment,function(value,commentDetailsCallback){
                        UserModel.findOne({"_id":value.user_id},{"name":1,"image":1},function(err,user){
                            if(err){
                                commentDetailsCallback(err);
                            }else{
                                value = value.toObject();
                                value["user_name"] = user.name;
                                value['user_image'] = (user.image)?(user.image):"defualt image";
                                commentDetailsCallback(null,value);
                            }
                        });
                    },function(err,imageComment){
                        if(err){
                            utility.internalServerError();
                        }else{
                            if(imageComment.length){
                                utility.successDataRequest(imageComment,response);                            
                            }else{
                                utility.failureRequest(response);
                            }
                        }
                    });
                }else{
                    utility.notFoundRequest(response);
                }
            });
        }else{
            utility.badRequest(response);
        }
    }
} 