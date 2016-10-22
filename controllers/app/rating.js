var mongoose = require('mongoose');
var redis = require('redis');
var fs = require('fs');
var gm = require('gm');
var models = require('../../models/appModel');
var validator = require('../validator');
var utility = require('../utility');
var RatingModel = models.rating;
var Rating = new RatingModel();
var ReviewCommentModel = models.reviewComment;
var ReviewComment = new ReviewCommentModel();
var ReviewLikeModel = models.reviewLike;
var ReviewLike = new ReviewLikeModel();
var RATING = {
    saveImage: function saveImage(imageArray,user_id,callback){
        let length = imageArray.length;
        for(let i=0; i< length; i++){
            var matches = imageArray[i].match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            var imageBuff = new Buffer(imageArray[i], 'base64');
            gm(imageBuff).identify(function(err,result){
                console.log(result);
            })
            switch(matches[1]){
                case 'image/jpeg':
                        var imageBuff = new Buffer(imageArray[i], 'base64');
                        var imageName = user_id+"review("+i+").jpeg";
                        fs.writeFile(imageName, imageBuff);
                    break;
                case 'image/png':
                        var imageBuff = new Buffer(imageArray[i], 'base64');
                        var imageName = user_id+"review("+i+").png";
                        fs.writeFile(imageName, imageBuff);
                    break;
            }
        }
        callback();
    }
}
module.exports = {
    reviewOutlet: function reviewOutlet(dataObject, response){//rate and review outlet
        if(typeof(dataObject.star) == 'number' && validator.validateObjectId(dataObject.user_id) && validator.validateObjectId(dataObject.outlet_id)){
            let obj = {
                user_id: dataObject.user_id,
                outlet_id: dataObject.outlet_id,
                star: dataObject.star,
                date: (new Date).getTime(),
                category: 'cloth'
            }
            if(typeof(dataObject.images) == 'object' && dataObject.images.length>0){//checking for images if uploaded during reivew
                RATING.saveImage(dataObject.images,dataObject.user_id,function(){
                    response.send("images comming");       
                });
            }
            if(typeof(dataObject.review) == 'string' && dataObject.review !=""){//checking for if its only rating or review
                obj.review = dataObject.review;
                let rating = new Rating(obj);
                rating.save(function(err,result){
                    if(!err,result){
                        utility.successRequest(response);
                    }else{
                        utility.internalServerError(response);
                    }
                });
            }else{
                Rating.find({"user_id":dataObject.user_id,"outlet_id":dataObject.outlet_id},{},{"limit":1} ,function(err,result){//only rating so here we will try to find whether already rated or not
                    var ratingKey = dataObject.user_id+":rating";
                    if(!err && result.length>0){
                        let date = (new Date).getTime();
                        Rating.update({"user_id":dataObject.user_id,"outlet_id":dataObject.outlet_id},{"$set":{"star":dataObject.star,"date":date}},function(err,result){//already rated so here updating user rating for this outlet
                            if(!err,result.nModified>0){
                                Rating.find({"user_id":dataObject.user_id}).sort({"date":-1}).exec(function(err,result){
                                    if(!err && result.length>0){
                                        utility.redisSaveKey(ratingKey,JSON.stringify(result));
                                    }else{}
                                });
                                utility.successRequest(response);
                            }else{
                                utility.internalServerError(response);
                            }       
                        });                        
                    }else{//inserting new rating 
                        let rating = new Rating(obj);
                        rating.save(function(err,result){
                            if(!err,result){
                                Rating.find({"user_id":dataObject.user_id}).sort({"date":-1}).exec(function(err,result){//caching all ratings for user
                                    if(!err && result.length>0){
                                        utility.redisSaveKey(ratingKey,JSON.stringify(result));
                                    }else{}
                                });
                                utility.successRequest(response);
                            }else{
                                utility.internalServerError(response);
                            }
                        });     
                    }
                });
            }
        }else{
            utility.badRequest(response);
        }
    },
    reviewLike: function reviewLike(dataObject, response){//function for liking a review
        if(validator.validateObjectId(dataObject.user_id) && validator.validateObjectId(dataObject.review_id)){
            Rating.update({"_id":dataObject.review_id},{"$pull":{"likes":dataObject.user_id}},function(err,result){
                if(!err && result.nModified>0){//already liked by user
                    ReviewLike.remove({"user_id":dataObject.user_id,"review_id":dataObject.review_id},function(err){
                        if(!err){
                            utility.successRequest(response);
                        }else{
                            utility.internalServerError(response);
                        }
                    });
                }else{//liking review
                    Rating.update({"_id":dataObject.review_id},{"$push":{"likes":dataObject.user_id}},function(err,result){
                        if(!err && result.nModified>0){
                            let obj = {
                                user_id: dataObject.user_id,
                                review_id: dataObject.review_id,
                                like: true,
                                date: (new Date).getTime()
                            }
                            let like = new ReviewLike(obj);
                            like.save(function(err,result){
                                if(!err && result){
                                    utility.successRequest(response);                            
                                }else{
                                    utility.internalServerError(response);
                                }
                            });
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
    reviewComment: function reviewComment(dataObject, response){//function for commenting on particular review
        if(validator.validateObjectId(dataObject.user_id) && validator.validateObjectId(dataObject.review_id) && typeof(dataObject.comment) == 'string'){
            let obj = {
                user_id: dataObject.user_id,
                review_id: dataObject.review_id,
                comment: dataObject.comment,
                date: (new Date).getTime()
            }
            let comment = new ReviewComment(obj);
            comment.save(function(err,result){
                if(!err && result){
                    Rating.update({"reviews._id":dataObject.review_id},{"$push":{"reviews.$.comments":result._id}},function(err,result){
                        if(!err && result.n>0){
                            utility.successRequest(response);
                        }else{
                            utility.internalServerError(response);
                        }
                    });
                }else{
                    utility.internalServerError(response);
                }    
            });
        }else{
            utility.badRequest(response);
        }
    },
    getRatings: function getRating(dataObject, response){//getting user rating for particular outlet
        if(validator.validateObjectId(dataObject.user_id)){      
            let ratingKey = dataObject.user_id+":rating"; 
            utility.redisFindKey(ratingKey,function(result){
                if(ratings = JSON.parse(result)){
                    utility.successDataRequest(ratings,response);
                }else{
                    let Rating = new RatingModel();
                    let user_id = mongoose.Types.ObjectId(dataObject.user_id);
                    Rating.aggregate([{"$lookup":{"from":"outlets","localField":"outlet_id","foreignField":"_id","as":"outlet_info"}},{"$match":{"user_id":user_id,"review":{"$eq":""},"outlet_info":{"$ne":[]}}},{"$project":{"_id":0,"rating_id":"$_id ","date":1,"star":1,"outlet_info.name":1,"outlet_info.name":1,"outlet_info.cover_image":1,"outlet_info.locality":1}},{"$sort":{"date":-1}}],function(err,result){
                        if(err){
                            utility.internalServerError(response);
                        }else if(result.length>0){
                            utility.redisSaveKey(ratingKey,JSON.stringify(result));
                            utility.successDataRequest(result,response);
                        }else{
                            utility.failureRequest(response);
                        }
                    });     
                }
            });
        }else{
            utility.badRequest(response);
        }
    },
    getReviews: function getReviews(dataObject, response){//getting user reviews for particular outlet
        if(validator.validateObjectId(dataObject.user_id)){      
            let reviewKey = dataObject.user_id+":review"; 
            utility.redisFindKey(reviewKey,function(result){
                if(ratings = JSON.parse(result)){
                    utility.successDataRequest(ratings,response);
                }else{
                    let Rating = new RatingModel();
                    let user_id = mongoose.Types.ObjectId(dataObject.user_id);
                    Rating.aggregate([{"$lookup":{"from":"outlets","localField":"outlet_id","foreignField":"_id","as":"outlet_info"}},{"$match":{"user_id":user_id,"review":{"$ne":""},"outlet_info":{"$ne":[]}}},{"$project":{"_id":0,"rating_id":"$_id ","date":1,"star":1,"review":1,"likes":{"$size":"$likes"},"comments":{"$size":"$comments"},"outlet_info.name":1,"outlet_info.name":1,"outlet_info.cover_image":1,"outlet_info.locality":1}},{"$sort":{"date":-1}}],function(err,result){
                        if(err){
                            console.log(err);
                            utility.internalServerError(response);
                        }else if(result.length>0){
                            utility.redisSaveKey(reviewKey,JSON.stringify(result));
                            utility.successDataRequest(result,response);
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