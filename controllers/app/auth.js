var mongoose = require('mongoose');
var redis = require('redis');
var jwt = require('jsonwebtoken');
var models = require('../../models/appModel');
var validator = require('../validator');
var env = require('../../env/development');
var utility = require('../utility');
var ObjectId = mongoose.Types.ObjectId;
var redisClient = redis.createClient();
var redisFlag = true;
redisClient.on('error',function(err){
    redisFlag = false;
})
var userModel = models.user;
module.exports = {
    login: function login(){//method for login functionality in our mobile app
        if(redisFlag){

        }else{

        }
    },
    register: function register(dataObject,response){//method for registering new user);
        if(!validator.validateEmptyObject(dataObject)){
            if(dataObject.auth_type && dataObject.name){
                var phone = new Array();
                if(dataObject.phone){
                    (dataObject.phone).forEach(function(element) {
                        phone.push(element);
                    }, this);
                }
                
                var user = {
                    name : dataObject.name,
                    email : (dataObject.email)?dataObject.email:"",
                    gender : (dataObject.gender)?dataObject.gender:"",
                    city : (dataObject.city)?dataObject.city:"",
                    news_letter : (dataObject.news_letter)?dataObject.news_letter:false,               
                    status : false,
                    last_location : (dataObject.last_location)?dataObject.last_location:"",                
                    joining_date : (new Date).getTime(),
                    last_active :  (new Date).getTime(), 
                    auth_type : dataObject.auth_type,
                    password : "",
                    profile_status : "",                
                    social_id : "",
                    phone : new Array(),
                }
                switch(dataObject.auth_type){
                    case 'faagio':
                            password = dataObject.password;                
                        break;
                    default:
                            if((dataObject.auth_type == "facebook") || (dataObject.auth_type == "google")){
                                if(validator.validateSocialId(dataObject.social_id)){//checking whether social id is valid or not
                                    user.social_id = dataObject.social_id;
                                    user.access_token = jwt.sign({id:user.social_id},env.secretKey);
                                    user.refresh_token = jwt.sign({id:user.social_id,name:user.name},env.secretKey);
                                    var NewUser = new userModel();
                                    NewUser.findOne({social_id:user.social_id},function(err,result){
                                        if(err){
                                            utility.internalServerError(response)
                                        }else{//no error in query operation 
                                            if(result){//user found with this social id 
                                                utility.conflictRequest(response);
                                            }else{//inserting new user
                                                var newUser = new NewUser(user);
                                                newUser.save(function(err,result){
                                                    if(err){
                                                        console.log(err);
                                                        utility.internalServerError(response);
                                                    }else{
                                                        if(result){
                                                            console.log("data inserted");
                                                            response.send(result);
                                                        }
                                                    }
                                                });                                             
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
            var name = dataObject.name;

            var email = dataObject.email;          
        }else{
            utility.badRequest(response);
        }
    }
}