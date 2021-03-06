var mongoose = require('mongoose');
var redis = require('redis');
var async = require('async');
var validator = require('../validator');
var utility = require('../utility');
var ReviewModel = mongoose.model('review');
var RatingModel = mongoose.model('rating');
var CheckInModel = mongoose.model('checkIn');
var ImageModel = mongoose.model('image');
var ReviewLikeModel = mongoose.model('reviewLike'); 
var ImageLikeModel = mongoose.model('imageLike');
var ImageCommentModel = mongoose.model('imageComment');
var env = require('../../env/development');
module.exports = {
    newsFeed: function newsFeed(dataObject,response){
        if(validator.validateEmptyObject(dataObject) &&  typeof(dataObject.time)!='undefined'){
            let feedTime = parseInt(dataObject.time);
            let latestTime = new Array();
            let timeObj ={}
            let sortObj ={ 
                "sort":{
                    "date":-1
                },
                "limit":1
            }  
            if(feedTime >0){
                timeObj.date={
                    "$lt":feedTime
                }
            }
            async.parallel([
                function(feedTimeCallback){//finding latest review time
                    ReviewModel.find(timeObj,{"date":1},sortObj,function(err,result){
                        if(!err && result){
                            feedTimeCallback(null,result[0]);
                        }else{
                            feedTimeCallback(err);
                        }
                    });
                },
                function(feedTimeCallback){//finding latest rating time
                    RatingModel.find(timeObj,{"date":1},sortObj,function(err,result){
                        if(!err && result){
                            feedTimeCallback(null,result[0]);
                        }else{
                            feedTimeCallback(err);
                        }
                    });
                },
                function(feedTimeCallback){//finding latest checkin time
                    CheckInModel.find(timeObj,{"date":1},sortObj,function(err,result){
                        if(!err && result){
                            feedTimeCallback(null,result[0]);
                        }else{
                            feedTimeCallback(err);
                        }
                    });
                },
                function(feedTimeCallback){//finding latest photo upload time
                    ReviewModel.find({"images":{"$ne":[]}},{"images":1,"_id":0},function(err,imageIds){
                        if(!err){
                            let ImageIds = new Array();
                            async.each(imageIds,function(value,imageIdsCallback){
                                ImageIds = ImageIds.concat(value.images);
                                imageIdsCallback(null);
                            },function(err){
                                if(!err){
                                    ImageModel.find({"$and":[{"_id":{"$nin":ImageIds}},timeObj]},{"date":1,"category":1},sortObj,function(err,result){
                                        if(!err && result){
                                            feedTimeCallback(null,result[0]);
                                        }else{
                                            feedTimeCallback(err);
                                        }
                                    });
                                }
                            });

                        }
                    });
                }
            ],function(err,result){
                if(!err && result){
                    let review = {
                        type:"review",
                        time:(result[0].date)?result[0].date:0
                    } 
                    let rating  = {
                        type: "rating",
                        time: (result[1].date)?result[1].date:0
                    }
                    let checkIn = {
                        type: "checkIn",
                        time: (result[2].date)?result[2].date:0
                    }
                    let image = {
                        type:"image",
                        time: (result[3].date)?result[3].date:0
                    }
                    var timing = new Array();
                    timing.push(review,rating,checkIn,image);
                    timing.sort(function compareNumbers(a, b) {return b.time - a.time;});
                    let FinalResult = new Array();
                    let i =0;
                    let limitConstant = 4;                    
                    async.each(timing,function(value,findDataCallback){
                        let timeBet = {}                
                        let type = timing[i].type;
                        if(i==3){
                            timeBet.date = {"$lte":timing[i].time}
                        }else{
                            timeBet.date = {"$gte":timing[i+1].time,"$lte":timing[i].time}  
                        }
                        if(FinalResult.length <4){
                            let lookup1 = {};
                            let lookup2 = {};
                            let match ={};
                            let project ={};
                            let sort ={};
                            let limit={};
                            let query;
                            switch(type){
                                case "review":
                                    lookup1.$lookup = {"from":"outlets","localField":"outlet_id","foreignField":"_id","as":"outlet_info"};
                                    lookup2.$lookup = {"from":"users","localField":"user_id","foreignField":"_id","as":"user_info"}
                                    match.$match = {"$and":[{"review":{"$ne":""},"outlet_info":{"$ne":[]}},{"user_info":{"$ne":[]}},timeBet]};  
                                    project.$project = {"_id":0,"review_id":"$_id","date":1,"star":1,"review":1,"images":1,"likes":{"$size":"$likes"},"comments":{"$size":"$comments"},"outlet_info._id":1,"outlet_info.name":1,"outlet_info.name":1,"outlet_info.cover_image":1,"outlet_info.locality":1,"outlet_info.category":1,"user_info._id":1,"user_info.image":1,"user_info.name":1};
                                    sort.$sort = {"date":-1};
                                    limit.$limit = limitConstant;                                      
                                    query = new Array();
                                    query.push(lookup1,lookup2,match,project,sort,limit);
                                    ReviewModel.aggregate(query,function(err,result){
                                        if(!err && result.length>0){
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
                                                if(!err){
                                                    FinalResult = FinalResult.concat(result);
                                                    findDataCallback(null);
                                                }
                                            });
                                        }
                                    });
                                break;
                                case "rating":
                                    lookup1.$lookup = {"from":"outlets","localField":"outlet_id","foreignField":"_id","as":"outlet_info"};
                                    lookup2.$lookup = {"from":"users","localField":"user_id","foreignField":"_id","as":"user_info"}
                                    match.$match = {"$and":[{"outlet_info":{"$ne":[]}},{"user_info":{"$ne":[]}},timeBet]};  
                                    project.$project = {"_id":0,"rating_id":"$_id","date":1,"star":1,"outlet_info._id":1,"outlet_info.name":1,"outlet_info.cover_image":1,"outlet_info.locality":1,"outlet_info.category":1,"user_info._id":1,"user_info.image":1,"user_info.name":1}
                                    sort.$sort = {"date":-1};
                                    limit.$limit = limitConstant                                        
                                    query = new Array();
                                    query.push(lookup1,lookup2,match,project,sort,limit);
                                    RatingModel.aggregate(query,function(err,result){
                                        if(!err && result.length>0){
                                            utility.outletDefaultCoverImage(result);
                                            FinalResult = FinalResult.concat(result);
                                            findDataCallback(null);                                       
                                        }
                                    });
                                break;
                                case "checkIn":
                                    lookup1.$lookup = {"from":"outlets","localField":"outlet_id","foreignField":"_id","as":"outlet_info"};
                                    lookup2.$lookup = {"from":"users","localField":"user_id","foreignField":"_id","as":"user_info"}
                                    match.$match = {"$and":[{"outlet_info":{"$ne":[]}},{"user_info":{"$ne":[]}},timeBet]};
                                    project.$project = {"_id":0,"user_id":1,"date":1,"outlet_info._id":1,"outlet_info.name":1,"outlet_info.cover_image":1,"outlet_info.locality":1,"outlet_info.category":1,"user_info._id":1,"user_info.image":1,"user_info.name":1};
                                    sort.$sort = {"date":-1};
                                    limit.$limit = limitConstant;                                        
                                    query = new Array();
                                    query.push(lookup1,lookup2,match,project,sort,limit); 
                                    CheckInModel.aggregate(query,function(err,result){
                                        if(!err && result.length > 0){
                                            utility.outletDefaultCoverImage(result);
                                            FinalResult = FinalResult.concat(result);
                                            findDataCallback(null);
                                        }
                                    });
                                break;
                                case "image":
                                    async.waterfall([
                                        function(callback){
                                            ReviewModel.find({"images":{"$ne":[]}},{"images":1},function(err,result){
                                                if(!err && result.length){
                                                    callback(null,result);
                                                }else{
                                                    callback(null,false);
                                                }
                                            });
                                        },
                                        function(imagesDocument,callback){
                                            let images = new Array();
                                            async.each(imagesDocument,function(value,imageCallback){
                                                images = images.concat(value.images);
                                                imageCallback(null);
                                            },function(err){
                                                if(!err){
                                                    callback(null,images);
                                                }else{
                                                    callback(err);
                                                }
                                            });

                                        },
                                        function(imagesArray,callback){
                                            lookup1.$lookup = {"from":"users","localField":"user_id","foreignField":"_id","as":"user_info"}
                                            lookup2.$lookup = {"from":"outlets","localField":"outlet_id","foreignField":"_id","as":"outlet_info"};
                                            match.$match ={"$and":[{"outlet_info":{"$ne":[]}},{"user_id":{"$ne":0}},{"user_info":{"$ne":[]}},{"_id":{"$nin":imagesArray}},timeBet]};
                                            project.$project = {"_id":0,"image_id":"$_id","category":1,"image":1,"date":-1,"outlet_info._id":1,"outlet_info.name":1,"outlet_info.cover_image":1,"outlet_info.locality":1,"outlet_info.category":1,"user_info._id":1,"user_info.image":1,"user_info.name":1}
                                            sort.$sort = {"date":-1};
                                            limit.$limit = limitConstant;
                                            query = new Array();
                                            query.push(lookup1,lookup2,match,project,sort,limit);
                                            ImageModel.aggregate(query,function(err,result){
                                                if(!err && result){
                                                    if(result.length){                                                                                                                    
                                                        async.each(result,function(value,checkCallback){
                                                            ImageLikeModel.find({"image_id":value._id},function(err,imageLikes){
                                                                if(err){
                                                                    checkCallback(err);
                                                                }else{
                                                                    value.like = imageLikes.length
                                                                }
                                                            });
                                                            ImageCommentModel.find({"image_id":value._id},{"user_id":1,"comment":1,"date":1},{"sort":{"date":-1}},function(err,imageComment){
                                                                if(err){
                                                                    checkCallback(err);
                                                                }else{  
                                                                    //manipulating comment getting user pic and name
                                                                    value.comment = imageComment.length;
                                                                }
                                                            });
                                                            utility.checkOutletImage(value.image,value.category,1024,function(image){
                                                                value.image = image;
                                                                checkCallback(null);                                                                
                                                            })
                                                        },function(err){
                                                            if(err){
                                                                callback(err);
                                                            }else{
                                                                FinalResult = FinalResult.concat(result);
                                                                callback(null);
                                                            }
                                                        });                                       
                                                    }else{
                                                        callback(null);                                        
                                                    }
                                                }else{
                                                    callback(err);
                                                }
                                            });
                                        }
                                    ],function(err,result){
                                        if(!err && result){
                                            findDataCallback(null,result);     
                                        }else{
                                            findDataCallback(err);
                                        }
                                    });
                                break;
                            }   
                        }else{
                            findDataCallback(null);
                        }
                        i++;
                    },function(err){
                        if(!err){
                            FinalResult.sort(function compareNumbers(a, b) {return b.date - a.date;});
                            FinalResult = FinalResult.slice(0,4);
                            async.map(FinalResult,function(value,userinfoCallback){
                                value.user_info[0].image = (value.user_info[0].image)?value.user_info[0].image:env.app.default_profile;
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
                                    userinfoCallback(null,value);
                                });
                            },function(err,result){
                                if(!err){
                                    utility.successDataRequest(result,response);                            
                                }else{
                                    utility.internalServerError(response);
                                }
                            })
                        }else{
                            utility.internalServerError(response);
                        }
                    });                    
                }else{
                    utility.failureRequest(response);
                }
            });
        }else{
            utility.badRequest(response);
        }
    }
} 