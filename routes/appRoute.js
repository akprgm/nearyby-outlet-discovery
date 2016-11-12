var Express = require('express');
var mongoose = require('mongoose');
var env = require('../env/development');
var utility = require('../controllers/utility');
var validator = require('../controllers/validator');
var auth = require('../controllers/app/auth');
var bookMark = require('../controllers/app/bookmark');
var checkIn = require('../controllers/app/checkin');
var rating = require('../controllers/app/rating');
var image = require('../controllers/app/image');
var user = require('../controllers/app/user');
var getNear = require('../controllers/app/getNear');
var outlet = require('../controllers/app/outlet');
var search = require('../controllers/app/search');
var filter = require('../controllers/app/filter');
var router = Express.Router();
router.post('/login',function(request,response){//route for login user
    auth.login(request.body,response);
});
router.post('/register',function(request,response){//route for registering user 
    auth.register(request.body,response);
});
/*router.use(function(request,response,next){
    if(validator.validateEmptyObject(request.body)){   
        if(validator.validateToken(request.body.access_token)){
            utility.verifyToken(request.body.access_token,'access',response,function(){
                next();
            });
        }else if(validator.validateToken(request.body.refresh_token)){
            utility.verifyToken(request.body.refresh_token,'refresh',response,function(){
                next();
            });
        }else{
            utility.badRequest(response);
        }
    }else if(validator.validateEmptyObject(request.query)){
        if(validator.validateToken(request.query.access_token)){
            utility.verifyToken(request.query.access_token,'access',response,function(){
                next();
            });
        }else if(validator.validateToken(request.query.refresh_token)){
            utility.verifyToken(request.query.refresh_token,'refresh',response,function(){
                next();
            });
        }else{
            utility.badRequest(response);
        }
    }else{
        utility.badRequest(response);
    }
});*/
router.get('/userProfile',function(request,response){
    user.userProfile(request.query,response);
});
router.get('/userRanking',function(request,response){
    user.userRanking(request.query,response);
});
router.get('/likeProfile',function(request,response){
    user.likeProfile(request.query,response);
});
router.get('/followOutlet',function(request,response){
    user.followOutlet(request.query,response);
});  
router.get('/getUserPics',function(request,response){
});
router.get('/getNearOutlets',function(request,response){
    getNear.getNearOutlets(request.query,response);
});
router.get('/getNearBookOutlets',function(request,response){
    getNear.getNearBookOutlets(request.query,response);
});
router.get('/getNearClothOutlets',function(request,response){
    getNear.getNearClothOutlets(request.query,response);
});
router.get('/getNearConsumerOutlets',function(request,response){
    getNear.getNearConsumerOutlets(request.query,response);
});
router.get('/getNearWatchOutlets',function(request,response){
    getNear.getNearWatchOutlets(request.query,response);
});
router.post('/reviewOutlet',function(request,response){//route for review outlet
    rating.reviewOutlet(request.body,response);
});
router.get('/outletDetails',function(request,response){
    outlet.outletDetails(request.query,response);
});
router.get('/likeReview',function(request,response){//route for liking review
    rating.reviewLike(request.query,response);
});
router.get('/commentReview',function(request,response){//route for commenting on review
    rating.reviewComment(request.query,response);
});
router.get('/getUserRatings', function(request,response){//route for getting all user ratings
    rating.getUserRatings(request.query, response);
});
router.get('/getUserReviews',function(request,response){//route for getting all user reviews     
    rating.getUserReviews(request.query, response);
});
router.get('/getOutletReviews',function(request,response){//route for getting all outlet reviews
    rating.getOutletReviews(request.query, response);
});
router.get('/bookMarkOutlet',function(request,response){//route for bookmarking a outlet 
    bookMark.bookMarkOutlet(request.query,response);
});
router.get('/getUserBookMarks',function(request,response){//route for getting user bookmarks
    bookMark.getBookMarks(request.query,response);
});
router.get('/checkInOutlet',function(request,response){//route for checkin outlet
    checkIn.checkInOutlet(request.query ,response);
});
router.get('/getCheckIns',function(request,response){//route for getting all userCheckins
    checkIn.getCheckIns(request.query,response);
});
router.get('/uploadPics',function(request,response){//route for getting all userCheckins
    image.uploadPics(request.query,response);
});
router.get('/likeImage',function(request,response){//route for liking review
    image.likeImage(request.query,response);
});
router.get('/commentImage',function(request,response){//route for commenting on review
    image.commentImage(request.query,response);
});
router.get('/search',function(request,response){
    search.searchString(request.query,response);
})
router.get('/filterSearch',function(request,response){
    search.filterSearch(request.query,response);
});
router.get('/filter',function(request,response){
    filter.filterOutlets(request.query,response);
});
router.post('/getToken',function(request,response){//route for getting new token when old expires
    auth.getToken(request.body,response)
});
router.post('/verifyToken',function(request,response){
    utility.verifyToken(request.body.access_token,'access',response,function(){
        response.send("token valid");
    });
});
router.get('/testing',function(requet,response){
    let result = utility.checkImage(env.app.base_directory+"/controllers/utility.js");
    if(result){
        response.send("file found");
    }else{
        response.send("file not found");
    }
});

module.exports = router;