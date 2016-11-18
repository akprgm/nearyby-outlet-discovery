var mongoose = require('mongoose');
var redis = require('redis');
var fs = require('fs');
var gm = require('gm');
var models = require('../../models/appModel');
var validator = require('../validator');
var utility = require('../utility');
var ImageModel = models.image;
var Image = new ImageModel();
var ImageCommentModel = models.imageComment;
var ImageComment = new ImageCommentModel();
var ImageLikeModel = models.imageLike;
var ImageLike = new ImageLikeModel();
var IMAGE = {
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
    uploadImage: function uploadImage(){
       /* let(__dir)
        gm*/
    },
    commentImage: function commentImage(dataObject, response){
        if(validator.validateObjectId(dataObject.user_id) && validator.validateObjectId(dataObject.image_id) && typeof(dataObject.comment) == 'string'){
            let obj = {
                user_id: dataObject.user_id,
                image_id: dataObject.image_id,
                comment: dataObject.comment,
                date: (new Date).getTime()
            }
            let comment = new ImageComment(obj);
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
            Image.remove({"user_id":dataObject.user_id,"image._id":dataObject.image_id},function(err,result){
                if(!err && result.nModified>0){
                    utility.successRequest(response);
                }else{
                    let obj = {
                        user_id: dataObject.user_id,
                        image_id: dataObject.image_id,
                        date: (new Date).getTime()
                    }
                    let imageLike = new ImageLike(obj);
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

    },
    getOutletPics: function getOutletPics(dataObject, response){       
    }
} 