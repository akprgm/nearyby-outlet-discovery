var mongoose = require('mongoose');
var schema = require('./schema.js');
module.exports = {
    user: function userModel(){
        return mongoose.model('user',schema.user);
    },
    outlet: function outletModel(){
        return mongoose.model('outlet',schema.outlet);
    },
    review: function reviewModel(){
        return mongoose.model('review',schema.review);
    },
    rating: function ratingModel(){
        return mongoose.model('rating',schema.rating);
    },
    bookMark: function bookMarkModel(){
        return mongoose.model('bookMark',schema.bookMark);
    },
    checkIn: function checkInModel(){
        return mongoose.model('checkIn',schema.checkIn);
    },
    image: function imageModel(){
        return mongoose.model('image',schema.image);  
    },
    reviewComment: function reviewCommentModel(){
        return mongoose.model('reviewComment',schema.reviewComment);
    },
    reviewLikes: function reviewLikesModel(){
        return mongoose.model('reviewLikes',schema.reviewLikes);
    },
    imageComment: function imageCommentModel(){
        return mongoose.model('imageComment',schema.imageComment);
    },
    imageLikes: function imageLikesModel(){
        return mongoose.model('imageLikes',schema.imageLIkes);
    },
    errorReport: function errorReportModel(){
        return mongoose.model('errorReport',schema.errorReport);
    },
    shutdownReport: function shutdownReportModel(){
        return mongoose.model('shutdownReport',schema.shutdownReport);
    }
}