var Express = require('express');//getting express routing module
var favicon = require('serve-favicon');
var morgan = require('morgan');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var env = require('./env/development');
var bodyParsar = require('body-parser');
var app = Express();//creating app instance of Express router
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/test';
var async = require('async');
var db;
MongoClient.connect(url, function(err, database) {
  if(err){
      console.log("connection to server not possible");
  }
  db = database; 
});
app.all('/',function(req,res){
    console.log("server started");
});
app.get('/manage/images',function(req,res){//managing images collection adding manual references
    var images;    
    async.series([
        function(callback){
           images = db.collection('images').find();
           callback();
        },
        function(callback){
            images.each(function(err,doc){
                if(doc){
                    var user_id = parseInt(doc.user_id);
                    var outlet_id = parseInt(doc.outlet_id);
                    async.parallel([
                        function(callback){//changing outlet_id here
                            var outletinfo = db.collection('outlets').find({"outlet_id":outlet_id},{"_id":1,"outlet_id":1,"category":1});
                            outletinfo.each(function(err,doc){
                                if(doc){
                                    var id = doc._id;
                                    var outlet_id = doc.outlet_id;
                                    var category = doc.category;
                                    //console.log("outlet_id "+ id+"   outlet_id "+outlet_id+"   category "+category);
                                    db.collection('images').update({"outlet_id":outlet_id,"category":category},{$set:{"outlet_id":id}});
                                    /*var check = db.collection('images').find({"outlet_id":outlet_id,"category":category});
                                    check.each(function(err,doc){
                                        if(doc){
                                            console.log("found "+doc.outlet_id +" category"+doc.category);
                                        }else{
                                            console.log("not found "+outlet_id +" category"+category)
                                        }
                                    });*/ 
                                }
                            });
                            callback();
                        },function(callback){//changing user_id here
                            if(user_id!=0){
                                console.log("id: "+typeof(user_id));
                                var userinfo = db.collection('users').find({"user_id":user_id},{"_id":1,"user_id":1});
                                userinfo.each(function(err,doc){
                                    if(doc){
                                        var user_id = doc.user_id;
                                        var id = doc._id;
                                        console.log("id: "+id+"  user_id:"+user_id);
                                        db.collection('images').update({"user_id":user_id},{$set:{"user_id":id}});
                                    }else{
                                        ///console.log();
                                    }
                                });
                            }
                            callback();
                        }
                    ],function(err,result){
                        if(err){
                            console.log(err);
                        }
                    });
                     
                }
            });
            callback();
        } 
    ],function(err,result){
        if(err){
            console.log(err);
        }
    });
    res.send("images management done");
});
app.get('/manage/rating',function(req,res){//managing rating collection adding manual references
    var rating;
    async.series([
        function(callback){//getting rating data in this task
            rating = db.collection('ratings').find();
            callback();  
        },
        function(callback){//performing manual references in this task
            rating.each(function(err,doc){
                if(doc){
                    var user_id = doc.user_id;
                    var outlet_id = doc.outlet_id;
                    var category = doc.category;
                    async.parallel([
                        function(callback){//changing outlet_id here
                            var outletinfo = db.collection('outlets').find({"outlet_id":outlet_id,"category":category},{"_id":1,"outlet_id":1,"category":1});
                            outletinfo.each(function(err,doc){
                                if(doc){
                                    var id = doc._id;
                                    var outlet_id = doc.outlet_id;
                                    var category = doc.category;
                                    db.collection('ratings').update({"outlet_id":outlet_id,"category":category},{$set:{"outlet_id":id}});
                                }
                            });
                            callback();
                        },function(callback){//changing user_id here
                            if(user_id!=0){
                                var userinfo = db.collection('users').find({"user_id":user_id},{"_id":1,"user_id":1});
                                userinfo.each(function(err,doc){
                                    if(doc){
                                        var user_id = doc.user_id;
                                        var id = doc._id;
                                        db.collection('ratings').update({"user_id":user_id},{$set:{"user_id":id}});
                                    }
                                });
                            }
                            callback();
                        }
                    ],function(err,result){
                        if(err){
                            console.log("error caught during changing userid and outletids "+err);
                        }
                    });
                    /*var reviews = doc.reviews;
                    var review_count = reviews.length;
                    async.series([
                        function(callback1){//user_id and outlet_id manipulation 
                            async.parallel([
                                function(callback){//changing outlet_id here
                                    var outletinfo = db.collection('outlets').find({"outlet_id":outlet_id,"category":category},{"_id":1,"outlet_id":1,"category":1});
                                    outletinfo.each(function(err,doc){
                                        if(doc){
                                            var id = doc._id;
                                            var outlet_id = doc.outlet_id;
                                            var category = doc.category;
                                            db.collection('rating').update({"outlet_id":outlet_id,"category":category},{$set:{"outlet_id":id}});
                                        }
                                    });
                                    callback();
                                },function(callback){//changing user_id here
                                    if(user_id!=0){
                                        var userinfo = db.collection('users').find({"user_id":user_id},{"_id":1,"user_id":1});
                                        userinfo.each(function(err,doc){
                                            if(doc){
                                                var user_id = doc.user_id;
                                                var id = doc._id;
                                                db.collection('rating').update({"user_id":user_id},{$set:{"user_id":id}});
                                            }
                                        });
                                    }
                                    callback();
                                }
                            ],function(err,result){
                                if(err){
                                    console.log("error caught during changing userid and outletids "+err);
                                }
                            });
                            callback1();
                        },
                        function(callback1){//review manipulation
                            if(review_count>0){
                                for(let i =0; i<review_count;i++){
                                    var review_id = reviews[i]['review_id'];
                                    async.series([
                                        function(callback2){//inserting new object id for review
                                            var id = new ObjectID;
                                            db.collection('rating').update({'reviews.review_id':review_id},{$set:{"reviews.$._id":id}});
                                            callback2();
                                        },
                                        function(callback2){//manipulation inside of review
                                            async.series([
                                                function(callback3){//manipulating comment_id inside review 
                                                    var comments = reviews[i].comments;
                                                    var commentCount = comments.length;
                                                    var commentIds = new Array();
                                                    for(let k=0;k<commentCount;k++){
                                                        var comment_id = comments[k];
                                                        async.series([
                                                            function(callback4){
                                                                var newDoc = db.collection('reviewComments').find({"comment_id":comment_id},{"_id":1});
                                                                newDoc.each(function(err,doc){
                                                                    if(doc){
                                                                        commentIds.push(doc._id);
                                                                    }
                                                                });
                                                                setTimeout(callback4,10000);
                                                            },
                                                            function(callback4){
                                                                db.collection('rating').update({"reviews.review_id":review_id},{$pull:{"reviews.$.comments":{$in:comments}}});
                                                                db.collection('rating').update({"reviews.review_id":review_id},{$push:{"reviews.$.comments":{$each:commentIds}}});
                                                                callback4();
                                                            }
                                                        ],function(err,result){
                                                            if(err){
                                                            console.log("err in comments");
                                                                
                                                            }
                                                        })     
                                                    }
                                                    callback3();
                                                },
                                                function(callback3){//manipulating reviewLikes inside review
                                                    var likes = reviews[i].likes;
                                                    var likesCount = likes.length;
                                                    var likeIds = new Array();
                                                    for(let i=0;i<likesCount;i++){
                                                        var like_id = likes[i];
                                                        var newDoc = db.collection('reviewLikes').find({"like_id":like_id},{"_id":1});
                                                        newDoc.each(function(err,doc){
                                                            if(doc){
                                                                likeIds.push(doc._id);
                                                            }
                                                        });
                                                    }
                                                    setTimeout(function() {
                                                        db.collection('rating').update({"reviews.review_id":review_id},{$pull:{"reviews.$.likes":{$in:likes}}});
                                                        db.collection('rating').update({"reviews.review_id":review_id},{$push:{"reviews.$.likes":{$each:likeIds}}});
                                                        callback3();    
                                                    }, 1000);
                                                    
                                                },
                                                function(callback3){//manipulating image id inside review
                                                    var images = reviews[i].images;
                                                    var imageCount = images.length;
                                                    var imageIds = new Array();
                                                    async.series([
                                                        function(callback4){
                                                            for(let j=0;j<imageCount;j++){
                                                                var image_id = images[j];
                                                                image_id = image_id.toString();
                                                                var newDoc = db.collection('images').find({"image_id":image_id},{"_id":1});
                                                                newDoc.each(function(err,doc){
                                                                    if(doc){
                                                                        var id = doc._id;    
                                                                        imageIds.push(id);              
                                                                    }
                                                                })  
                                                            }
                                                            setTimeout(callback4,10000);
                                                        },
                                                        function(callback4){
                                                            console.log(imageIds);
                                                            db.collection('rating').update({"reviews.review_id":review_id},{$pull:{"reviews.$.images":{$in:images}}});
                                                            db.collection('rating').update({"reviews.review_id":review_id},{$push:{"reviews.$.images":{$each:imageIds}}});
                                                            callback4();
                                                        }
                                                        ],function(err,result){
                                                            if(err){
                                                                console.log("error in image")
                                                            }
                                                    });
                                                    callback3();
                                                }
                                            ],function(err,result){
                                                if(err){
                                                    console.log("error caught during image id changes");
                                                }
                                            })
                                            callback2();
                                        }
                                    ],function(err,results){
                                        if(err){
                                            console.log("error caught during changin review or image ids" + err);
                                        }
                                    });
                                }
                            }
                            
                            callback1();
                        }
                    ],function(err,result){
                        if(err){
                            console.log("error caught during getting rating data or 1s async call" +err);
                        }
                    })*/
                }
            });
            callback();
        }
    ],function(err,result){ 
        if(err){
            console.log("error caught during getng rating data or 1s async call" +err);
        }
    });
    res.send("rating managed ");    
});
app.get('/manage/review',function(req,res){//managing rating collection adding manual references
    var review;
    async.series([
        function(callback){//getting rating data in this task
            review = db.collection('reviews').find();
            callback();  
        },
        function(callback){//performing manual references in this task
            review.each(function(err,reviewDoc){
                if(reviewDoc){      
                    async.parallel([
                        function(callback3){//changing outlet_id here
                            var outletinfo = db.collection('outlets').find({"outlet_id":reviewDoc.outlet_id,"category":reviewDoc.category},{"_id":1,"outlet_id":1,"category":1});
                            outletinfo.each(function(err,doc){
                                if(doc){
                                    var id = doc._id;
                                    var outlet_id = doc.outlet_id;
                                    var category = doc.category;
                                    db.collection('reviews').update({"outlet_id":outlet_id,"category":category},{$set:{"outlet_id":id}});
                                }
                            });
                            callback3();
                        },
                        function(callback3){//changing user_id here
                            if(reviewDoc.user_id!=0){
                                var userinfo = db.collection('users').find({"user_id":reviewDoc.user_id},{"_id":1,"user_id":1});
                                userinfo.each(function(err,doc){
                                    if(doc){
                                        var user_id = doc.user_id;
                                        var id = doc._id;
                                        db.collection('reviews').update({"user_id":user_id},{$set:{"user_id":id}});
                                    }
                                });
                            }
                            callback3();
                        },
                        function(callback3){//manipulating reviewLikes inside review
                            var likes = reviewDoc.likes;
                            var likesCount = likes.length;
                            var likeIds = new Array();
                            for(let i=0;i<likesCount;i++){
                                var like_id = likes[i];
                                var newDoc = db.collection('reviewLikes').find({"like_id":like_id},{"_id":1});
                                newDoc.each(function(err,doc){
                                    if(doc){
                                        likeIds.push(doc._id);
                                    }
                                });
                            }
                            setTimeout(function() {
                                db.collection('reviews').update({"review_id":reviewDoc.review_id},{$pull:{"likes":{$in:likes}}});
                                db.collection('reviews').update({"review_id":reviewDoc.review_id},{$push:{"likes":{$each:likeIds}}});
                                callback3();    
                            }, 10000);
                            
                        },
                        function(callback3){//manipulating reviewComments inside review
                            var comments = reviewDoc.comments;
                            var commentsCount = comments.length;
                            var commentIds = new Array();
                            for(let i=0;i<commentsCount;i++){
                                var comment_id = comments[i];
                                var newDoc = db.collection('reviewComments').find({"review_id":reviewDoc.review_id},{"_id":1});
                                newDoc.each(function(err,doc){
                                    if(doc){
                                        commentIds.push(doc._id);
                                    }
                                });
                            }
                            setTimeout(function() {
                                db.collection('reviews').update({"review_id":reviewDoc.review_id},{$pull:{"comments":{$in:comments}}});
                                db.collection('reviews').update({"review_id":reviewDoc.review_id},{$push:{"comments":{$each:commentIds}}});
                                callback3();    
                            }, 10000);
                        },
                        function(callback3){//manipulating image id inside review
                            var images = reviewDoc.images;
                            var imageCount = images.length;
                            var imageIds = new Array();
                            async.series([
                                function(callback4){
                                    for(let j=0;j<imageCount;j++){
                                        var image_id = images[j];
                                        var newDoc = db.collection('images').find({"image_id":image_id},{"_id":1});
                                        newDoc.each(function(err,doc){
                                            if(doc){
                                                var id = doc._id;    
                                                imageIds.push(id);              
                                            }
                                        })  
                                    }
                                    setTimeout(callback4,10000);
                                },
                                function(callback4){
                                    db.collection('reviews').update({"review_id":reviewDoc.review_id},{$pull:{"images":{$in:images}}});
                                    db.collection('reviews').update({"review_id":reviewDoc.review_id},{$push:{"images":{$each:imageIds}}});
                                    callback4();
                                }
                                ],function(err,result){
                                    if(err){
                                        console.log("error in image")
                                    }
                            });
                            callback3();
                        }
                    ],function(err,result){
                        if(err){
                            console.log("error caught during changing userid and outletids "+err);
                        }
                    });
                }
            });
            callback();
        }
    ],function(err,result){ 
        if(err){
            console.log("error caught during getng rating data or 1s async call" +err);
        }
    });
    res.send("rating managed ");    
});
app.get('/manage/bookMarks',function(req,res){
    var bookMarks;    
    async.series([
        function(callback){
           bookMarks = db.collection('bookMarks').find();
           callback();
        },
        function(callback){
            bookMarks.each(function(err,doc){
                if(doc){
                    var user_id = doc.user_id;
                    var outlet_id = doc.outlet_id;
                    var category = doc.category;
                    async.parallel([
                        function(callback){//changing outlet_id here
                            var outletinfo = db.collection('outlets').find({"outlet_id":outlet_id,"category":category},{"_id":1,"outlet_id":1,"category":1});
                            outletinfo.each(function(err,doc){
                                if(doc){
                                    var id = doc._id;
                                    var outlet_id = doc.outlet_id;
                                    var category = doc.category;
                                    db.collection('bookMarks').update({"outlet_id":outlet_id,"category":category},{$set:{"outlet_id":id}});
                                }
                            });
                            callback();
                        },function(callback){//changing user_id here
                            if(user_id!=0){
                                var userinfo = db.collection('users').find({"user_id":user_id},{"_id":1,"user_id":1});
                                userinfo.each(function(err,doc){
                                    if(doc){
                                        var user_id = doc.user_id;
                                        var id = doc._id;
                                        db.collection('bookMarks').update({"user_id":user_id},{$set:{"user_id":id}});
                                    }
                                });
                            }
                            callback();
                        }
                    ],function(err,result){
                        if(err){
                            console.log(err);
                        }
                    });
                     
                }
            });
            callback();
        } 
    ],function(err,result){
        if(err){
            console.log(err);
        }
    });
    res.send("bookMarks management done");
});
app.get('/manage/checkIns',function(req,res){
    var checkIns;    
    async.series([
        function(callback){
           checkIns = db.collection('checkIns').find();
           callback();
        },
        function(callback){
            checkIns.each(function(err,doc){
                if(doc){
                    var user_id = doc.user_id;
                    var outlet_id = doc.outlet_id;
                    var category = doc.category;
                    async.parallel([
                        function(callback){//changing outlet_id here
                            var outletinfo = db.collection('outlets').find({"outlet_id":outlet_id,"category":category},{"_id":1,"outlet_id":1,"category":1});
                            outletinfo.each(function(err,doc){
                                if(doc){
                                    var id = doc._id;
                                    var outlet_id = doc.outlet_id;
                                    var category = doc.category;
                                    db.collection('checkIns').update({"outlet_id":outlet_id,"category":category},{$set:{"outlet_id":id}});
                                }
                            });
                            callback();
                        },function(callback){//changing user_id here
                            if(user_id!=0){
                                var userinfo = db.collection('users').find({"user_id":user_id},{"_id":1,"user_id":1});
                                userinfo.each(function(err,doc){
                                    if(doc){
                                        var user_id = doc.user_id;
                                        var id = doc._id;
                                        db.collection('checkIns').update({"user_id":user_id},{$set:{"user_id":id}});
                                    }
                                });
                            }
                            callback();
                        }
                    ],function(err,result){
                        if(err){
                            console.log(err);
                        }
                    });
                     
                }
            });
            callback();
        } 
    ],function(err,result){
        if(err){
            console.log(err);
        }
    });
    res.send("checkIns management done");
});
app.get('/manage/imageLikes',function(req,res){
    var imageLikes;    
    async.series([
        function(callback){
           imageLikes = db.collection('imageLikes').find();
           callback();
        },
        function(callback){
            imageLikes.each(function(err,doc){
                if(doc){
                    var user_id = doc.user_id;
                    var image_id = (doc.image_id).toString();
                    async.parallel([
                        function(callback){//changing outlet_id here
                            var imageinfo = db.collection('images').find({"image_id":image_id},{"_id":1,"image_id":1});
                            imageinfo.each(function(err,doc){
                                if(doc){
                                    var id = doc._id;
                                    var image_id = parseInt(doc.image_id);
                                    db.collection('imageLikes').update({"image_id":image_id},{$set:{"image_id":id}});
                                }
                            });
                            callback();
                        },function(callback){//changing user_id here
                            if(user_id!=0){
                                var userinfo = db.collection('users').find({"user_id":user_id},{"_id":1,"user_id":1});
                                userinfo.each(function(err,doc){
                                    if(doc){
                                        var user_id = doc.user_id;
                                        var id = doc._id;
                                        db.collection('imageLikes').update({"user_id":user_id},{$set:{"user_id":id}});
                                    }
                                });
                            }
                            callback();
                        }
                    ],function(err,result){
                        if(err){
                            console.log(err);
                        }
                    });
                     
                }
            });
            callback();
        } 
    ],function(err,result){
        if(err){
            console.log(err);
        }
    });
    res.send("imageLikes management done");
});
app.get('/manage/imageComments',function(req,res){
    var imageComments;    
    async.series([
        function(callback){
           imageComments = db.collection('imageComments').find();
           callback();
        },
        function(callback){
            imageComments.each(function(err,doc){
                if(doc){
                    var user_id = doc.user_id;
                    var image_id = doc.image_id;
                    async.parallel([
                        function(callback){//changing outlet_id here
                            var imageinfo = db.collection('images').find({"image_id":image_id},{"_id":1,"image_id":1});
                            imageinfo.each(function(err,doc){
                                if(doc){
                                    var id = doc._id;
                                    var image_id = doc.image_id;
                                    db.collection('imageComments').update({"image_id":image_id},{$set:{"image_id":id}});
                                }
                            });
                            callback();
                        },function(callback){//changing user_id here
                            if(user_id!=0){
                                var userinfo = db.collection('users').find({"user_id":user_id},{"_id":1,"user_id":1});
                                userinfo.each(function(err,doc){
                                    if(doc){
                                        var user_id = doc.user_id;
                                        var id = doc._id;
                                        db.collection('imageComments').update({"user_id":user_id},{$set:{"user_id":id}});
                                    }
                                });
                            }
                            callback();
                        }
                    ],function(err,result){
                        if(err){
                            console.log(err);
                        }
                    });
                     
                }
            });
            callback();
        } 
    ],function(err,result){
        if(err){
            console.log(err);
        }
    });
    res.send("imageLikes management done");
});
app.get('/manage/errorReports',function(req,res){
    var errorReports;    
    async.series([
        function(callback){
           errorReports = db.collection('errorReports').find();
           callback();
        },
        function(callback){
            errorReports.each(function(err,doc){
                if(doc){
                    var user_id = doc.user_id;
                    var outlet_id = doc.outlet_id;
                    var category = doc.category;
                    async.parallel([
                        function(callback){//changing outlet_id here
                            var outletinfo = db.collection('outlets').find({"outlet_id":outlet_id,"category":category},{"_id":1,"outlet_id":1,"category":1});
                            outletinfo.each(function(err,doc){
                                if(doc){
                                    var id = doc._id;
                                    var outlet_id = doc.outlet_id;
                                    var category = doc.category;
                                    db.collection('errorReports').update({"outlet_id":outlet_id,"category":category},{$set:{"outlet_id":id}});
                                }
                            });
                            callback();
                        },function(callback){//changing user_id here
                            if(user_id!=0){
                                var userinfo = db.collection('users').find({"user_id":user_id},{"_id":1,"user_id":1});
                                userinfo.each(function(err,doc){
                                    if(doc){
                                        var user_id = doc.user_id;
                                        var id = doc._id;
                                        db.collection('errorReports').update({"user_id":user_id},{$set:{"user_id":id}});
                                    }
                                });
                            }
                            callback();
                        }
                    ],function(err,result){
                        if(err){
                            console.log(err);
                        }
                    });
                     
                }
            });
            callback();
        } 
    ],function(err,result){
        if(err){
            console.log(err);
        }
    });
    res.send("errorReports management done");
});
app.get('/manage/shutdownReports',function(req,res){
    var shutdownReports;    
    async.series([
        function(callback){
           shutdownReports = db.collection('shutdownReports').find();
           callback();
        },
        function(callback){
            shutdownReports.each(function(err,doc){
                if(doc){
                    var user_id = doc.user_id;
                    var outlet_id = doc.outlet_id;
                    var category = doc.category;
                    async.parallel([
                        function(callback){//changing outlet_id here
                            var outletinfo = db.collection('outlets').find({"outlet_id":outlet_id,"category":category},{"_id":1,"outlet_id":1,"category":1});
                            outletinfo.each(function(err,doc){
                                if(doc){
                                    var id = doc._id;
                                    var outlet_id = doc.outlet_id;
                                    var category = doc.category;
                                    db.collection('shutdownReports').update({"outlet_id":outlet_id,"category":category},{$set:{"outlet_id":id}});
                                }
                            });
                            callback();
                        },function(callback){//changing user_id here
                            if(user_id!=0){
                                var userinfo = db.collection('users').find({"user_id":user_id},{"_id":1,"user_id":1});
                                userinfo.each(function(err,doc){
                                    if(doc){
                                        var user_id = doc.user_id;
                                        var id = doc._id;
                                        db.collection('shutdownReports').update({"user_id":user_id},{$set:{"user_id":id}});
                                    }
                                });
                            }
                            callback();
                        }
                    ],function(err,result){
                        if(err){
                            console.log(err);
                        }
                    });
                     
                }
            });
            callback();
        } 
    ],function(err,result){
        if(err){
            console.log(err);
        }
    });
    res.send("shutdownReports management done");
});
app.get('/manage/reviewComments',function(req,res){
    var comments;    
    async.series([
        function(callback){
           comments = db.collection('reviewComments').find();
           callback();
        },
        function(callback){
            comments.each(function(err,doc){
                if(doc){
                    var user_id = doc.user_id;
                    var review_id = doc.review_id;
                    async.parallel([
                        function(callback){//changing review_id here
                            var outletinfo = db.collection('rating').find({"reviews.review_id":review_id},{"_id":1,"reviews.review_id":1});
                            outletinfo.each(function(err,doc){
                                if(doc){
                                    var id = doc._id;
                                    var outlet_id = doc.outlet_id;
                                    var review_id = doc.reviews[0].review_id;
                                    db.collection('reviewComments').update({"review_id":review_id},{$set:{"review_id":id}});
                                }
                            });
                            callback();
                        },function(callback){//changing user_id here
                            if(user_id!=0){
                                var userinfo = db.collection('users').find({"user_id":user_id},{"_id":1,"user_id":1});
                                userinfo.each(function(err,doc){
                                    if(doc){
                                        var user_id = doc.user_id;
                                        var id = doc._id;
                                        db.collection('reviewComments').update({"user_id":user_id},{$set:{"user_id":id}});
                                    }
                                });
                            }
                            callback();
                        }
                    ],function(err,result){
                        if(err){
                            console.log(err);
                        }
                    });
                     
                }
            });
            callback();
        } 
    ],function(err,result){
        if(err){
            console.log(err);
        }
    });
    res.send("review Comments management done");
});
app.get('/manage/reviewLikes',function(req,res){
    var reviewLikes;    
    async.series([
        function(callback){
           reviewLikes = db.collection('reviewLikes').find();
           callback();
        },
        function(callback){
            reviewLikes.each(function(err,doc){
                if(doc){
                    var user_id = doc.user_id;
                    var review_id = doc.review_id;
                    async.parallel([
                        function(callback){//changing review_id here
                            var outletinfo = db.collection('rating').find({"reviews.review_id":review_id},{"_id":1,"reviews.review_id":1});
                            outletinfo.each(function(err,doc){
                                if(doc){
                                    var id = doc._id;
                                    var outlet_id = doc.outlet_id;
                                    var review_id = doc.reviews[0].review_id;
                                    db.collection('reviewLikes').update({"review_id":review_id},{$set:{"review_id":id}});
                                }
                            });
                            callback();
                        },function(callback){//changing user_id here
                            if(user_id!=0){
                                var userinfo = db.collection('users').find({"user_id":user_id},{"_id":1,"user_id":1});
                                userinfo.each(function(err,doc){
                                    if(doc){
                                        var user_id = doc.user_id;
                                        var id = doc._id;
                                        db.collection('reviewLikes').update({"user_id":user_id},{$set:{"user_id":id}});
                                    }
                                });
                            }
                            callback();
                        }
                    ],function(err,result){
                        if(err){
                            console.log(err);
                        }
                    });
                     
                }
            });
            callback();
        } 
    ],function(err,result){
        if(err){
            console.log(err);
        }
    });
    res.send("review likes management done");
});
app.get('/manage/ids',function(req,res){
    db.collection('users').updateMany({},{$unset:{"user_id":1}});//removing old ids from user collection
    db.collection('outlets').updateMany({},{$unset:{"outlet_id":1}});//removing old ids from outlet collection
    db.collection('imageComments').updateMany({},{$unset:{"comment_id":1}});//removing old ids from imageComments collection
    db.collection('imageLikes').updateMany({},{$unset:{"like_id":1}});//removing old ids from imageLikes collection    
    db.collection('images').updateMany({},{$unset:{"image_id":1}});//removing old ids from images collection    
    //db.collection('rating').updateMany({},{$unset:{"rating_id":1}});//removing old ids from rating collection    
    //db.collection('rating').updateMany({"reviews.review_id":{$exists:true}},{$unset:{"reviews.$.review_id":1}});
    db.collection('reviewComments').updateMany({},{$unset:{"comment_id":1}});//removing old ids from imageComments collection
    db.collection('reviewLikes').updateMany({},{$unset:{"like_id":1}});//removing old ids from imageLikes collection    
    res.send("id management done");
});
app.get('/manage/hashPassword',function(req,res){
    var bcrypt = require('bcrypt');
    const saltRounds = 10;
    var user  = db.collection('users').find({"auth_type":"faagio"},{"_id":1,"password":1});
    user.each(function(err,doc){
        if(doc){
            var id = doc._id;
            var password = doc.password;
            bcrypt.genSalt(saltRounds, function(err, salt) {
                bcrypt.hash(password, salt, function(err, hash) {
                    db.collection('users').update({"_id":id},{$set:{"password":hash}});
                });
            });
        }    
    })
    res.send("password management done");   
});
app.get('/manage/refreshToken',function(req,res){
    var users = db.collection('users').find();
    users.each(function(err,user){
        if(user){
            if(user.auth_type==="faagio"){
                let refresh_token = jwt.sign({id:user.email,auth_type:"faagio"},env.secretKey);//refresh token for user
                db.collection('users').update({"_id":user._id},{"$set":{"refresh_token":refresh_token}});
            }else{
                let refresh_token = jwt.sign({id:user.social_id,auth_type:"faagio"},env.secretKey);//refresh token for user                
                db.collection('users').update({"_id":user._id},{"$set":{"refresh_token":refresh_token}});
            }
        }
    });
    res.send("done");
});
app.listen(5004,function(){
    console.log("server listening on port 5000");
}); 
