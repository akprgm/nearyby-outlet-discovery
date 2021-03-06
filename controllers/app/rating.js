var mongoose = require('mongoose');
var redis = require('redis');
var async = require('async');
var fs = require('fs');
var gm = require('gm');
var request = require('request');
var validator = require('../validator');
var utility = require('../utility');
var env = require('../../env/development');
var UserModel = mongoose.model('user');
var RatingModel = mongoose.model('rating');
var ReviewModel = mongoose.model('review');
var ReviewCommentModel = mongoose.model('reviewComment');
var ReviewLikeModel = mongoose.model('reviewLike');
var ImageModel = mongoose.model('image');
var OutletModel = mongoose.model('outlet');
module.exports = {
    reviewOutlet: function reviewOutlet(dataObject, response){//rate and review outlet
        if(typeof(dataObject.star) == 'string' && validator.validateObjectId(dataObject.user_id) && validator.validateObjectId(dataObject.outlet_id) && validator.validateCategory(dataObject.category)){
            let obj = {
                user_id: dataObject.user_id,
                outlet_id: dataObject.outlet_id,
                star: parseInt(dataObject.star),
                date: (new Date).getTime(),
                category: dataObject.category
            }
            if(typeof(dataObject.review) == 'string' && dataObject.review !=""){//checking for if its only rating or review
                if(typeof(dataObject.photos) == 'object' && dataObject.photos.length>0){//checking for images if uploaded during reivew
                    obj.images = new Array();
                    async.each(dataObject.photos,function(photo,photoCallBack){
                        let dateTime = (new Date).getTime();
                        let imageName = obj.user_id+"_"+obj.category+"_"+dateTime;
                        let imageObject = {
                            user_id: dataObject.user_id,
                            outlet_id: dataObject.outlet_id,
                            category: dataObject.category,
                            image: imageName,
                            uploaded_by: "user",
                            date: dateTime
                        }
                        utility.saveImage(imageObject,photo,function(bool){
                            if(bool){
                                obj.images.push(bool);
                                photoCallBack(null);
                            }else{
                                photoCallBack(false)
                            }
                        });
                    },function(err){
                        if(!err){//rating outlet with images
                            obj.review = dataObject.review;                            
                            let rating = new RatingModel(obj);
                            let review = new ReviewModel(obj);
                            async.parallel([
                                function(callback){
                                    RatingModel.find({"$and":[{"user_id":dataObject.user_id},{"outlet_id":dataObject.outlet_id}]},{},{"limit":1} ,function(err,result){//only rating so here we will try to find whether already rated or not
                                        if(!err && result.length>0){
                                            let date = (new Date).getTime();
                                            RatingModel.update({"$and":[{"user_id":dataObject.user_id},{"outlet_id":dataObject.outlet_id}]},{"$set":{"star":dataObject.star,"date":date}},function(err,result){//already rated so here updating user rating for this outlet
                                                if(!err && result.nModified>0){
                                                    utility.saveUserRating(dataObject);
                                                    callback(null,true);
                                                }else{
                                                    callback(null,false);
                                                }       
                                            });                        
                                        }else{//inserting new rating 
                                            let rating = new RatingModel(obj);
                                            rating.save(function(err,result){
                                                if(!err && result){
                                                    UserModel.update({"_id":dataObject.user_id},{"$inc":{"rating":1}},function(err,user){});
                                                    utility.saveUserRating(dataObject);
                                                    callback(null,true);
                                                }else{
                                                    callback(null,false);
                                                }
                                            });     
                                        }
                                    });
                                },
                                function(callback){
                                    review.save(function(err,result){
                                        if(!err && result){//find user Reviews and store them in redis cache
                                            UserModel.update({"_id":dataObject.user_id},{"$inc":{"review":1}},function(err,user){});
                                            utility.saveUserReviews(dataObject);
                                            callback(null,true);
                                        }else{
                                            callback(null,false);
                                        }
                                    });
                                } 
                            ],function(err,result){
                                if(!err && result.length>0){
                                    if(result[0] && result[1]){
                                        utility.successRequest(response);
                                    }else{
                                        utility.internalServerError(response);
                                    }
                                }else{
                                    utility.internalServerError(response);
                                }
                            });
                        }
                    });
                }else{
                    obj.review = dataObject.review;                    
                    let rating = new RatingModel(obj);
                    let review = new ReviewModel(obj);
                    async.parallel([
                        function(callback){
                            RatingModel.find({"$and":[{"user_id":dataObject.user_id},{"outlet_id":dataObject.outlet_id}]},{},{"limit":1} ,function(err,result){//only rating so here we will try to find whether already rated or not
                                if(!err && result.length>0){
                                    let date = (new Date).getTime();
                                    RatingModel.update({"$and":[{"user_id":dataObject.user_id},{"outlet_id":dataObject.outlet_id}]},{"$set":{"star":dataObject.star,"date":date}},function(err,result){//already rated so here updating user rating for this outlet
                                        if(!err && result.nModified>0){
                                            utility.saveUserRating(dataObject);
                                            callback(null,true);
                                        }else{
                                            callback(null,false);
                                        }       
                                    });                        
                                }else{//inserting new rating 
                                    let rating = new RatingModel(obj);
                                    rating.save(function(err,result){
                                        if(!err && result){
                                            UserModel.update({"_id":dataObject.user_id},{"$inc":{"rating":1}},function(err,user){});
                                            utility.saveUserRating(dataObject);
                                            callback(null,true);
                                        }else{
                                            callback(null,false);
                                        }
                                    });     
                                }
                            });
                        },
                        function(callback){
                            review.save(function(err,result){
                                if(!err && result){//find user Reviews and store them in redis cache
                                    UserModel.update({"_id":dataObject.user_id},{"$inc":{"review":1}},function(err,user){
                                    });
                                    utility.saveUserReviews(dataObject);
                                    callback(null,true);
                                }else{
                                    callback(null,false);
                                }
                            });
                        } 
                    ],function(err,result){
                        if(!err && result.length>0){
                            if(result[0] && result[1]){
                                utility.successRequest(response);
                            }else{
                                utility.internalServerError(response);
                            }
                        }else{
                            utility.internalServerError(response);
                        }
                    });
                }
            }else{
                RatingModel.find({"$and":[{"user_id":dataObject.user_id},{"outlet_id":dataObject.outlet_id}]},{},{"limit":1} ,function(err,result){//only rating so here we will try to find whether already rated or not
                    if(!err && result.length>0){
                        let date = (new Date).getTime();
                        RatingModel.update({"$and":[{"user_id":dataObject.user_id},{"outlet_id":dataObject.outlet_id}]},{"$set":{"star":dataObject.star,"date":date}},function(err,result){//already rated so here updating user rating for this outlet
                            if(!err && result.nModified>0){
                                utility.saveUserRating(dataObject);
                                utility.successRequest(response);
                            }else{
                                utility.internalServerError(response);
                            }       
                        });                        
                    }else{//inserting new rating 
                        let rating = new RatingModel(obj);
                        rating.save(function(err,result){
                            if(!err && result){
                                UserModel.update({"_id":dataObject.user_id},{"$inc":{"rating":1}},function(err,user){});
                                utility.saveUserRating(dataObject);
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
            ReviewModel.update({"_id":dataObject.review_id},{"$pull":{"likes":dataObject.user_id}},function(err,result){
                if(!err && result.nModified>0){//already liked by user
                    ReviewLikeModel.remove({"$and":[{"user_id":dataObject.user_id},{"review_id":dataObject.review_id}]},function(err){
                        if(!err && result.n>0){
                            ReviewModel.findOne({"_id":dataObject.review_id},{"outlet_id":1,"user_id":1},function(err,result){
                                if(!err && result){
                                    let outlet_id = String(result.outlet_id);
                                    let user_id = String(result.user_id);
                                    let obj = {"user_id":user_id,"outlet_id":outlet_id}
                                    utility.saveUserReviews(obj);
                                }
                            });
                            utility.successRequest(response);
                        }else{
                            utility.internalServerError(response);
                        }
                    });
                }else{//liking review
                    ReviewModel.update({"_id":dataObject.review_id},{"$push":{"likes":dataObject.user_id}},function(err,result){
                        if(!err && result.nModified>0){
                            let obj = {
                                user_id: dataObject.user_id,
                                review_id: dataObject.review_id,
                                like: true,
                                date: (new Date).getTime()
                            }
                            let Like = new ReviewLikeModel(obj);
                            Like.save(function(err,result){
                                if(!err && result){
                                     ReviewModel.findOne({"_id":dataObject.review_id},{"outlet_id":1,"user_id":1},function(err,result){
                                            if(!err && result){
                                                let outlet_id = String(result.outlet_id);
                                                let user_id = String(result.user_id);
                                                let obj = {"user_id":user_id,"outlet_id":outlet_id}
                                                utility.saveUserReviews(obj);
                                            }
                                        });
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
            let comment = new ReviewCommentModel(obj);
            comment.save(function(err,result){
                if(!err && result){
                    ReviewModel.update({"_id":dataObject.review_id},{"$push":{"comments":result._id}},function(err,result){
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
    getUserRatings: function getUserRating(dataObject, response){//getting user rating for particular outlet
        if(validator.validateObjectId(dataObject.user_id) && validator.validateOffset(dataObject.offset)){      
            let ratingKey = dataObject.user_id+":ratings";
            let offset = dataObject.offset; 
            utility.redisFindKey(ratingKey,function(result){
                if(ratings = JSON.parse(result)){
                    utility.successDataRequest(ratings.slice(offset,offset+10),response);
                }else{
                    let user_id = mongoose.Types.ObjectId(dataObject.user_id);
                    RatingModel.aggregate([{"$lookup":{"from":"outlets","localField":"outlet_id","foreignField":"_id","as":"outlet_info"}},{"$lookup":{"from":"users","localField":"user_id","foreignField":"_id","as":"user_info"}},{"$match":{"$and":[{"user_id":user_id},{"outlet_info":{"$ne":[]}},{"user_info":{"$ne":[]}}]}},{"$project":{"_id":0,"rating_id":"$_id","date":1,"star":1,"user_info._id":1,"user_info.image":1,"user_info.name":1,"outlet_info._id":1,"outlet_info.name":1,"outlet_info.cover_image":1,"outlet_info.locality":1,"outlet_info.category":1}},{"$sort":{"date":-1}}],function(err,result){
                        if(err){
                            utility.internalServerError(response);
                        }else if(result.length>0){
                            result = result.slice(offset,offset+10);
                            async.map(result,function(value,ratingUserInfoCallback){
                                let cover_image = value.outlet_info[0].cover_image;
                                let category = value.outlet_info[0].category;
                                let image_path = env.app.gallery_directory+category+"/cover_images_500/"+cover_image;
                                let image_access_path = env.app.gallery_url+category+"/cover_images_500/"+cover_image;
                                utility.checkImage(image_path,image_access_path,function(new_image_url){
                                    if(new_image_url){
                                        value.outlet_info[0].cover_image = new_image_url;
                                    }else{
                                        let imageNameNo = Math.floor(Math.random() * 2) + 1;
                                        value.outlet_info[0].cover_image = env.app.images_url+"default_shopping_"+category+imageNameNo+".jpg";
                                    }
                                    if(!value.user_info[0].image){
                                        value.user_info[0].image = env.app.default_profile;
                                    }
                                    ratingUserInfoCallback(null,value);
                                });   
                            },function(err,result){
                                if(err){
                                    utility.internalServerError(response);
                                }else{
                                    utility.redisSaveKey(ratingKey,JSON.stringify(result));
                                    utility.successDataRequest(result,response);
                                }
                            });
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
    getUserReviews: function getUserReviews(dataObject, response){//getting user reviews for particular outlet
        if(validator.validateObjectId(dataObject.user_id) && validator.validateObjectId(dataObject.profile_id) && validator.validateOffset(dataObject.offset)){      
            let reviewKey = dataObject.user_id+":reviews"; 
            let offset = parseInt(dataObject.offset);
            utility.redisFindKey(reviewKey,function(result){
                if(reviews = JSON.parse(result)){
                    utility.successDataRequest(reviews.slice(offset,offset+10),response);
                }else{
                    let user_id = mongoose.Types.ObjectId(dataObject.user_id);
                    ReviewModel.aggregate([{"$lookup":{"from":"outlets","localField":"outlet_id","foreignField":"_id","as":"outlet_info"}},{"$lookup":{"from":"users","localField":"user_id","foreignField":"_id","as":"user_info"}},{"$match":{"$and":[{"user_id":user_id},{"review":{"$ne":""}},{"outlet_info":{"$ne":[]}},{"user_info":{"$ne":[]}}]}},{"$project":{"_id":0,"review_id":"$_id","date":1,"star":1,"user_info._id":1,"user_info.image":1,"user_info.name":1,"review":1,"likes":{"$size":"$likes"},"comments":{"$size":"$comments"},"outlet_info._id":1,"outlet_info.name":1,"outlet_info.name":1,"outlet_info.cover_image":1,"outlet_info.locality":1,"outlet_info.category":1}},{"$sort":{"date":-1}}],function(err,result){
                        if(err){
                            utility.internalServerError(response);
                        }else if(result.length>0){
                            async.parallel([
                                function(reviewCallback){
                                    async.map(result,function(value,reviewImageCallback){
                                        let cover_image = value.outlet_info[0].cover_image;
                                        let category = value.outlet_info[0].category;
                                        let image_path = env.app.gallery_directory+category+"/cover_images_500/"+cover_image;
                                        let image_access_path = env.app.gallery_url+category+"/cover_images_500/"+cover_image;
                                        utility.checkImage(image_path,image_access_path,function(new_image_url){
                                            if(new_image_url){
                                                value.outlet_info[0].cover_image = new_image_url;
                                            }else{
                                                let imageNameNo = Math.floor(Math.random() * 2) + 1;
                                                value.outlet_info[0].cover_image = env.app.images_url+"default_shopping_"+category+imageNameNo+".jpg";
                                            }
                                        });
                                        let review_id = mongoose.Types.ObjectId(value.review_id);
                                        ImageModel.aggregate([{"$match":{"review_id":review_id}},{"$project":{"_id":0,"image_id":"$_id","image":1,"category":1}},{"$sort":{"date":-1}},{"$limit":10}],function(err,images){
                                            if(!err && images){
                                                let photos = new Array();
                                                async.each(images,function(value,checkImageCallback){
                                                    utility.checkOutletImage(value.image,value.category,500,function(image){
                                                        photos.push(value);
                                                        checkImageCallback();
                                                    });
                                                },function(err){
                                                    if(!err){
                                                        value.photos = photos;
                                                        reviewImageCallback(null);                                               
                                                    }else{
                                                        reviewImageCallback(err);
                                                    }
                                                });
                                            }else{
                                                reviewImageCallback(err);
                                            }
                                        });
                                    },function(err,result){
                                        if(err){
                                            reviewCallback(err);
                                        }else{
                                            reviewCallback(null);
                                        }
                                        
                                    })
                                },function(reviewCallback){
                                    async.map(result,function(value,reviewLikeCallback){
                                        if(!value.user_info[0].image){
                                            value.user_info[0].image = env.app.default_profile;
                                        }
                                        ReviewLikeModel.find({"$and":[{"review_id":value.review_id},{"user_id":dataObject.profile_id}]},function(err,reviewLike){
                                            if(err){
                                                reviewLikeCallback(err);
                                            }else{
                                                if(reviewLike.length){
                                                    value.liked = true;
                                                    reviewLikeCallback(null);
                                                }else{
                                                    value.liked = false;
                                                    reviewLikeCallback(null);
                                                }
                                            }
                                        })
                                    },function(err,result){
                                        if(err){
                                            reviewCallback(err);
                                        }else{
                                            reviewCallback(null);
                                        }
                                    });
                                }
                            ],function(err){
                                if(err){
                                    utility.internalServerError(response);
                                }else{
                                    utility.redisSaveKey(reviewKey,JSON.stringify(result));
                                    utility.successDataRequest(result.slice(offset,offset+10),response);
                                }
                            });
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
    getOutletReviews: function getOutletReviews(dataObject, response){//getting outlet reviews for particular outlet
        if(validator.validateObjectId(dataObject.outlet_id) && validator.validateOffset(dataObject.offset)){      
            let reviewKey = dataObject.outlet_id+":reviews"; 
            let offset = parseInt(dataObject.offset);
            utility.redisFindKey(reviewKey,function(result){
                if(reviews = JSON.parse(result)){
                    utility.successDataRequest(reviews.slice(offset,offset+10),response);
                }else{
                    let outlet_id = mongoose.Types.ObjectId(dataObject.outlet_id);
                    ReviewModel.aggregate([{"$lookup":{"from":"outlets","localField":"outlet_id","foreignField":"_id","as":"outlet_info"}},{"$lookup":{"from":"users","localField":"user_id","foreignField":"_id","as":"user_info"}},{"$match":{"$and":[{"outlet_id":outlet_id},{"review":{"$ne":""}},{"outlet_info":{"$ne":[]}},{"user_info":{"$ne":[]}}]}},{"$project":{"_id":0,"review_id":"$_id","date":1,"star":1,"review":1,"likes":{"$size":"$likes"},"comments":{"$size":"$comments"},"outlet_info._id":1,"outlet_info.name":1,"outlet_info.cover_image":1,"outlet_info.locality":1,"outlet_info.category":1,"user_info._id":1,"user_info.image":1,"user_info.name":1}},{"$sort":{"date":-1}}],function(err,result){
                        if(err){
                            utility.internalServerError(response);
                        }else if(result.length>0){
                            async.parallel([
                                function(reviewCallback){
                                    async.map(result,function(value,reviewImageCallback){
                                        let cover_image = value.outlet_info[0].cover_image;
                                        let category = value.outlet_info[0].category;
                                        let image_path = env.app.gallery_directory+category+"/cover_images_500/"+cover_image;
                                        let image_access_path = env.app.gallery_url+category+"/cover_images_500/"+cover_image;
                                        utility.checkImage(image_path,image_access_path,function(new_image_url){
                                            if(new_image_url){
                                                value.outlet_info[0].cover_image = new_image_url;
                                            }else{
                                                let imageNameNo = Math.floor(Math.random() * 2) + 1;
                                                value.outlet_info[0].cover_image = env.app.images_url+"default_shopping_"+category+imageNameNo+".jpg";
                                            }
                                        });
                                        if(!value.user_info[0].image){
                                            value.user_info[0].image = env.app.default_profile;
                                        }
                                        let review_id = mongoose.Types.ObjectId(dataObject.review_id);
                                        ImageModel.aggregate([{"$match":{"review_id":review_id}},{"$project":{"_id":0,"image_id":"$_id","image":1,"category":1}},{"$sort":{"date":-1}},{"$limit":10}],function(err,images){
                                            if(!err && images){
                                                let photos = new Array();
                                                async.each(images,function(value,checkImageCallback){
                                                    utility.checkOutletImage(value.image,value.category,500,function(image){
                                                        photos.push(value);
                                                        checkImageCallback();
                                                    });
                                                },function(err){
                                                    if(!err){
                                                        value.photos = photos;
                                                        reviewImageCallback(null);                                               
                                                    }else{
                                                        reviewImageCallback(err);
                                                    }
                                                });
                                            }else{
                                                reviewImageCallback(err);
                                            }
                                        });
                                    },function(err,result){
                                        if(err){
                                            reviewCallback(err);
                                        }else{
                                            reviewCallback(null);
                                        }
                                        
                                    })
                                },function(reviewCallback){
                                    async.map(result,function(value,reviewLikeCallback){
                                        ReviewLikeModel.find({"review_id":value.review_id},function(err,reviewLike){
                                            if(err){
                                                reviewLikeCallback(err);
                                            }else{
                                                if(reviewLike.length){
                                                    value.liked = true;
                                                    reviewLikeCallback(null);
                                                }else{
                                                    value.liked = false;
                                                    reviewLikeCallback(null);
                                                }
                                            }
                                        })
                                    },function(err,result){
                                        if(err){
                                            reviewCallback(err);
                                        }else{
                                            reviewCallback(null);
                                        }
                                    });
                                }
                            ],function(err){
                                if(err){
                                    utility.internalServerError(response);
                                }else{
                                    utility.outletDefaultCoverImage(result);
                                    utility.redisSaveKey(reviewKey,JSON.stringify(result));
                                    utility.successDataRequest(result.slice(offset,offset+10),response);
                                }
                            });
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
    getReviewDetails: function getReviewDetails(dataObject, response){//getting review Details here
        if(validator.validateObjectId(dataObject.review_id)){
            ReviewModel.findOne({"_id":dataObject.review_id},{"outlet_id":1,"user_id":1,"review":1,"category":1,"date":1,"star":1,"images":1,"comments":1,"likes":1},function(err,review){
                if(err){
                    utility.internalServerError(response);
                }else{
                    if(review){
                        review = review.toObject();
                        async.parallel([
                            function(reviewDetailsCallback){//getting user details
                                ReviewCommentModel.aggregate([{"$match":{"$and":[{"review_id":dataObject.review_id},{"user_id":{"$in":review.comments}}]}},{"$project":{"user_id":1,"comment":1,"date":1}},{"$sort":{"date":-1}},{"$limit":10}],function(err,reviewComment){
                                    if(err){
                                        reviewDetailsCallback(err);
                                    }else{  
                                        //manipulating comment getting user pic and name
                                        async.map(reviewComment,function(value,commentDetailsCallback){
                                            UserModel.findOne({"_id":value.user_id},{"name":1,"image":1},function(err,user){
                                                if(err){
                                                    commentDetailsCallback(err);
                                                }else{
                                                    if(user){
                                                        review.user_name = user.name;
                                                        review.user_image = (user.image)?(user.image):"defualt image";
                                                        reviewDetailCallback(null);
                                                    }else{
                                                        review.user_name = "";
                                                        review.user_image = "";
                                                        reviewDetailCallback(null);
                                                    }
                                                }
                                            });
                                        },function(err,reviewComment){
                                            if(err){
                                                reviewDetailsCallback(err);
                                            }else{
                                                reviewDetailsCallback(null,reviewComment);
                                            }
                                        });
                                    }
                                });
                            },
                            function(reviewDetailCallback){//getting user details
                                if(review.user_id){
                                    UserModel.findOne({"_id":review.user_id},{"name":1,"image":1},function(err,user){
                                        if(err){
                                            reviewDetailCallback(err);
                                        }else{ 
                                            if(user){
                                                review.user_name = user.name;
                                                review.user_image = (user.image)?(user.image):env.app.default_profile;
                                                reviewDetailCallback(null);
                                            }else{
                                                review.user_name = "";
                                                review.user_image = "";
                                                reviewDetailCallback(null);
                                            }
                                        }
                                    });
                                }else{
                                    review.user_name = "";
                                    review.user_image = "";
                                    reviewDetailCallback(null);
                                }
                            },
                            function(reviewDetailCallback){//getting outlet details
                                OutletModel.findOne({"_id":review.outlet_id},{"name":1},function(err, outlet){
                                    if(err){
                                        reviewDetailCallback(err);
                                    }else{
                                        if(outlet){
                                            review.outlet_name = outlet.name;                                        
                                        }else{
                                            review.outlet_name = "";                                        
                                        }
                                        reviewDetailCallback(null);
                                    }
                                }); 
                            },
                            function(reviewDetailCallback){
                                ReviewLikeModel.find({"review_id":review._id},function(err,reviewLike){
                                    if(err){
                                        reviewDetailCallback(err);
                                    }else{
                                        if(reviewLike.length){
                                            review.liked = true;
                                            reviewDetailCallback(null);
                                        }else{
                                            review.liked = false;
                                            reviewDetailCallback(null);
                                        }
                                    }
                                });
                            }

                        ],function(err,result){
                            if(err){
                                utility.internalServerError(response);
                            }else{
                                review.likes = result[0];
                                review.comments = result[1];
                                utility.successDataRequest(review,response);
                            }       
                        });
                    }else{
                        utility.notFoundRequest(response);
                    }
                }
            });
        }else{
            utility.badRequest(response);
        }
    },
    getCommentsOnReview: function getCommentsOnReview(dataObject, response){//getting comments on review 
        if(validator.validateObjectId(dataObject.review_id) && validator.validateOffset(dataObject.offset)){
            let offset = parseInt(dataObject.offset);
            ReviewCommentModel.find({"review_id":dataObject.review_id},{"user_id":1,"comment":1,"date":1},{"sort":{"date":-1},"limit":10,"skip":offset},function(err,reviewComment){
                if(err){
                    utility.internalServerError(response);
                }else if(!err && reviewComment.length){  
                    //manipulating comment getting user pic and name
                    async.map(reviewComment,function(value,commentDetailsCallback){
                        UserModel.findOne({"_id":value.user_id},{"name":1,"image":1},function(err,user){
                            if(err){
                                commentDetailsCallback(err);
                            }else{
                                value = value.toJSON();
                                if(user){
                                    value.user_name = user.name;
                                    value.user_image = (user.image)?(user.image):env.app.default_profile;
                                    commentDetailsCallback(null,value);
                                }else{
                                    value.user_name = "";
                                    value.user_image = "";
                                    commentDetailsCallback(null,value);
                                }
                            }
                        });
                    },function(err,reviewComment){
                        if(err){
                            utility.internalServerError(response);
                        }else{
                            if(reviewComment.length){
                                utility.successDataRequest(reviewComment,response);                            
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