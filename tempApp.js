var Express = require('express');//getting express routing module
var favicon = require('serve-favicon');
var morgan = require('morgan');
var bodyParsar = require('body-parser');
var app = Express();//creating app instance of Express router
var MongoClient = require('mongodb').MongoClient;
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
                                    var outlet_id = doc.outlet_id.toString();
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
                                        var user_id = doc.user_id.toString();
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
                    var image_id = doc.image_id;
                    async.parallel([
                        function(callback){//changing outlet_id here
                            var imageinfo = db.collection('images').find({"image_id":image_id},{"_id":1,"image_id":1});
                            imageinfo.each(function(err,doc){
                                if(doc){
                                    var id = doc._id;
                                    var image_id = doc.image_id;
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
app.listen(5000,function(){
    console.log("server listening on port 5000");
}); 
