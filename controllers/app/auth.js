var mongoose = require('mongoose');
var redis = require('redis');
var async = require('async');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');
var validator = require('../validator');
var env = require('../../env/development');
var utility = require('../utility');
var UserModel = mongoose.model('user');
module.exports = {
    login: function login(dataObject,response){//method for login functionality in our mobile app
        let auth_type = dataObject.auth_type;
        switch(auth_type){
            case 'faagio':
                if(validator.validateEmail(dataObject.email) && validator.validatePassword(dataObject.password)){
                    utility.redisFindKey(dataObject.email,function(user_id){//getting mongoKey which will be used for getting user info from redis store
                        if(user_id){
                            utility.userInfo(user_id, function(user){
                                bcrypt.compare(dataObject.password, user.password, function(err, status) {//checking for password
                                    if(status && user.auth_type===dataObject.auth_type){
                                        utility.redisSetExpireTime(dataObject.email);
                                        utility.userSendData(user, function(user){
                                            user.access_token = jwt.sign({id:user.email},env.secretKey,{expiresIn: '1d'});//access token for user                                        
                                            utility.successDataRequest(user, response);                                                                                            
                                        });
                                    }else{
                                        utility.notFoundRequest(response);
                                    }
                                });
                            });
                        }else{
                            UserModel.findOne({"$and":[{email:dataObject.email},{auth_type:"faagio"}]},function(err,user){
                                if(err){
                                    utility.internalServerError(response);
                                }else if(user){
                                    bcrypt.compare(dataObject.password, user.password, function(err, status) {//checking for password
                                        if(status){
                                            utility.redisSaveKey(user._id,JSON.stringify(user));//saving user data in redis cache store
                                            utility.redisSaveKey(user.email,(user._id).toString());//saving refrence to user data with social id key
                                            utility.userSendData(user,function(user){
                                                user.access_token = jwt.sign({id:user.email},env.secretKey,{expiresIn: '1d'});//access token for user                                        
                                                utility.successDataRequest(user,response);                                                                                            
                                            });
                                        }else{
                                            utility.notFoundRequest(response);
                                        }
                                    });
                                }else{
                                    utility.notFoundRequest(response);
                                }
                            });
                        }                       
                    });
                }else{
                    utility.badRequest(response);
                } 
            break;
            default:
                if(dataObject.auth_type == 'facebook' || dataObject.auth_type == 'google'){
                    if(validator.validateSocialId(dataObject.social_id)){
                        utility.redisFindKey(dataObject.social_id,function(user_id){
                            if(user_id){
                                utility.userInfo(user_id,function(user){
                                    if(user.auth_type===dataObject.auth_type){
                                        utility.redisSetExpireTime(dataObject.social_id);
                                        utility.userSendData(user,function(user){
                                            user.access_token = jwt.sign({id:user.email},env.secretKey,{expiresIn: '1d'});//access token for user                                        
                                            utility.successDataRequest(user,response);                                                                                            
                                        });
                                    }else{
                                        utility.notFoundRequest(response);
                                    }
                                });
                            }else{
                                UserModel.findOne({"$and":[{social_id:dataObject.social_id},{auth_type:dataObject.auth_type}]},function(err,result){
                                    if(err){
                                        utility.internalServerError(response);
                                    }else{
                                        if(result){
                                            utility.redisSaveKey(result._id,JSON.stringify(result));//saving user data in redis cache store
                                            utility.redisSaveKey(result.social_id,(result._id).toString());//saveing refrence to user data with social id key
                                            utility.userSendData(result,function(user){
                                                user.access_token = jwt.sign({id:user.email},env.secretKey,{expiresIn: '1d'});//access token for user                                        
                                                utility.successDataRequest(user,response);                                                                                            
                                            });
                                        }else{
                                            utility.notFoundRequest(response);
                                        }
                                    }
                                });
                            }
                        });
                    }else{
                        utility.badRequest(response);
                    }
                }else{
                    utility.badRequest(response);   
                }
            break;
        }
    },
    register: function register(dataObject,response){//method for registering new user);
        if(validator.validateEmptyObject(dataObject)){//validating for valid object is recieved by client or not
            if(dataObject.auth_type && dataObject.name){//auth type and name of user is must to proceed further in registration
                let phone = new Array();
                if(dataObject.phone){//pushing contact info in phone array if any 
                    (dataObject.phone).forEach(function(element) {
                        phone.push(element);
                    }, this);
                }
                let user = {//user object 
                    name : dataObject.name,
                    email : (dataObject.email)?dataObject.email:"",
                    image : "",
                    gender : (dataObject.gender)?dataObject.gender:"",
                    city : (dataObject.city)?dataObject.city:"",
                    news_letter : (dataObject.news_letter)?dataObject.news_letter:false,               
                    status : true,
                    last_location : (dataObject.last_location)?dataObject.last_location:"",
                    firebase_token: (dataObject.firebase_token)?dataObject.firebase_token:"",                
                    joining_date : (new Date).getTime(),
                    last_active :  (new Date).getTime(), 
                    auth_type : dataObject.auth_type,
                    password : "",
                    profile_status : "",                
                    social_id : "",
                    rating:0,
                    review:0,
                    image_upload:0,
                    check_in:0,
                    phone : new Array(),
                }
                switch(dataObject.auth_type){//method of registration
                    case 'faagio':
                        if(validator.validatePassword(dataObject.password) && validator.validateEmail(dataObject.email)){// password and email is must for faagio registration system
                            async.waterfall([
                                function(registerCallback){
                                    async.parallel([
                                        function(registerCallback1){//finding the hash of password
                                                bcrypt.genSalt(env.saltRounds, function(err, salt){
                                                    if(err){registerCallback1(err);}
                                                    else{
                                                        bcrypt.hash(dataObject.password, salt, function(err, hash) {
                                                                if(err){
                                                                    registerCallback1(err);
                                                                }else{
                                                                    registerCallback1(null,hash);
                                                                }
                                                            }
                                                        );
                                                    }
                                                });
                                        },
                                        function(registerCallback1){
                                            UserModel.findOne({email:user.email,auth_type:"faagio"},function(err,result){//checking whether user with this social id already exist or not
                                                if(err){
                                                    registerCallback1(err);
                                                }else{//no error in query operation 
                                                    if(result){//user found with this social id 
                                                        registerCallback1(null,false);
                                                    }else{
                                                        registerCallback1(null,true);
                                                    }
                                                } 
                                            });
                                        }
                                    ],function(err,result){
                                        if(err){
                                            registerCallback(err);
                                        }else{
                                            if(result[0] && result[1]){
                                                registerCallback(null,result[0]);//seding hash of password
                                            }else{
                                                if(result[0]==="error"){
                                                    registerCallback("error");//error in generating hash of password                                       
                                                }else{
                                                    registerCallback("exists");//user already exists
                                                }
                                            }
                                        }
                                    });
                                },function(hash,registerCallback){
                                    if(hash){
                                        user.status = false;//verify email before activating user account
                                        user.password = hash;//hash password 
                                        user.refresh_token = jwt.sign({id:user.email,auth_type:"faagio"},env.secretKey);//refresh token for user
                                        let newUser = new UserModel(user);//new instance of user model
                                        newUser.save(function(err,result){//saving new user in our mongo store
                                            if(err){
                                                registerCallback(err);//sending internal server error response to client
                                            }else{
                                                if(result){
                                                    utility.redisSaveKey(result._id,JSON.stringify(result));//saving user data in redis cache store
                                                    utility.redisSaveKey(result.email,(result._id).toString());//saving refrence to user data with social id key
                                                    utility.userSendData(result,function(user){
                                                        user.access_token = jwt.sign({id:result._id},env.secretKey,{expiresIn: '1d'});//access token for user                                                                                        
                                                        registerCallback(null,user);
                                                    });
                                                }
                                            }
                                        }); 
                                        
                                    }else{
                                        registerCallback("error");
                                    }
                                }
                            ],function(err,result){
                                if(!err && result){
                                    if(result){
                                        utility.successDataRequest(result,response);                                    
                                    }else{
                                        utility.internalServerError(response)
                                    }
                                }else{
                                    if(err==="exists"){
                                        utility.conflictRequest(response);                                    
                                    }else{
                                        utility.internalServerError(response);
                                    }
                                }
                            });
                        }else{
                            utility.badRequest(response);
                        }              
                    break;
                    default:
                        if((dataObject.auth_type == "facebook") || (dataObject.auth_type == "google")){
                            if(validator.validateSocialId(dataObject.social_id)){//checking whether social id is valid or not
                                user.social_id = dataObject.social_id;//google or facebook account id
                                user.refresh_token = jwt.sign({id:user.social_id,auth_type:"social"},env.secretKey);//refresh token for user                                                       
                                async.waterfall([
                                    function(registerCallback){
                                        UserModel.findOne({social_id:user.social_id},function(err,result){//checking whether user with this social id already exist or not
                                            if(err){
                                                registerCallback(err);
                                            }else{//no error in query operation 
                                                if(result){//user found with this social id 
                                                    registerCallback("exists");
                                                }else{
                                                    registerCallback(null);
                                                }
                                            }
                                        });
                                    },
                                    function(registerCallback){
                                        var newUser = new UserModel(user);
                                        newUser.save(function(err,result){//saving new user in our mongo store
                                            if(err){
                                                registerCallback(err);//sending internal server error response to client
                                            }else{
                                                if(result){
                                                    utility.redisSaveKey(result._id,JSON.stringify(result));//saving user data in redis cache store
                                                    utility.redisSaveKey(result.social_id,(result._id).toString());//saveing refrence to user data with social id key
                                                    utility.userSendData(result,function(user){
                                                        user.access_token = jwt.sign({id:result._id},env.secretKey,{expiresIn: '1d'});//access token for user                                        
                                                        registerCallback(null,user);//sending internal server error response to client                                                    
                                                    });
                                                }
                                            }
                                        });
                                    }
                                ],function(err,result){
                                    if(!err && result){
                                        utility.successDataRequest(result,response);
                                    }else{
                                        if(err=="exists"){
                                            utility.conflictRequest(response);
                                        }else{
                                            utility.internalServerError(response);
                                        }
                                    }
                                });
                            }else{//no social id found in request 
                                utility.badRequest(response); 
                            }
                        }else{//invalid auth type for social registration
                            utility.badRequest(response); 
                        }
                    break;
                }
            }else{
                utility.badRequest(response);            
            }          
        }else{
            utility.badRequest(response);
        }
    },
    getToken: function getToken(dataObject,response){
        if(validator.validateToken(dataObject.refresh_token) && validator.validateObjectId(dataObject.user_id)){
            utility.verifyToken(dataObject.refresh_token,'refresh',response,function(decoded){
                if(dataObject.firebase_token){//storing firebase token for old users 
                    UserModel.update({"_id":dataObject.user_id},{"$set":{"firebase_token":dataObject.firebase_token}},function(err,result){});
                }
                utility.redisFindKey(dataObject.user_id,function(user){
                    if(user){
                        user  = JSON.parse(user);
                        if(user.refresh_token === dataObject.refresh_token){
                            let access_token = jwt.sign({id:user._id},env.secretKey,{expiresIn: '1d'});//access token for user
                            utility.successDataRequest(access_token,response);
                        }else{
                            utility.unauthorizedRequest(response);
                        }                     
                    }else{
                        UserModel.findOne({_id:dataObject.user_id},function(err,user){
                            if(!err && user){
                                utility.redisSaveKey(user._id,JSON.stringify(user));//saving user data in redis cache store
                                utility.redisSaveKey(user.email,(user._id).toString());//saveing refrence to user data with social id key
                                let access_token = jwt.sign({id:user._id},env.secretKey,{expiresIn: '1d'});//access token for user                                        
                                utility.successDataRequest(access_token,response);                            
                            }else{
                                utility.notFoundRequest(response);                                                            
                            }     
                        });                            
                    }
                });             
            });
        }else{ 
            utility.badRequest(response);
        }
    }
}