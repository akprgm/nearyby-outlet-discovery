var Express = require('express');
var mongoose = require('mongoose');
var env = require('../env/development');
var utility = require('../controllers/utility');
var auth = require('../controllers/app/auth');
var bookMark = require('../controllers/app/bookmark');
var checkIn = require('../controllers/app/checkin');
var rating = require('../controllers/app/rating');
var image = require('../controllers/app/image');
var user = require('../controllers/app/user');
var router = Express.Router();
router.post('/Login',function(request,response){//route for login user
    return auth.login(request.body,response);
});
router.post('/register',function(request,response){//route for registering user 
    auth.register(request.body,response);
});
router.get('/user',function(request,response){//route for getting user profile
    utility.userInfo('57ff3c9e3c799fcdc171b968',function(user){
        if(user){
            utility.userBasicData(user,function(info){
                response.send(info);
            })
        }else{
            response.send("error");
        }
    });
});
router.get('/userProfile',function(request,response){
});
router.get('/userRanking',function(request,response){
    user.userRanking(request.query,response);
});
router.get('/getUserPics',function(request,response){
});
router.post('/reviewOutlet',function(request,response){//route for review outlet
    rating.reviewOutlet(request.body,response);
});
router.get('/likeReview',function(request,response){//route for liking review
    rating.reviewLike(request.query,response);
});
router.get('/commentReview',function(request,response){//route for commenting on review
    rating.reviewComment(request.query,response);
});
router.get('/getRating', function(request,response){//route for getting all user ratings
    rating.getRatings(request.query, response);
});
router.get('/getUserReviews',function(request,response){//route for getting all user reviews     
    rating.getReviews(request.query, response);
});
router.get('/getOutletReviews',function(request,response){//route for getting all outlet reviews
});
router.get('/bookMarkOutlet',function(request,response){//route for bookmarkig a outlet 
    bookMark.bookMarkOutlet(request.query,response);
});
router.get('/getUserBookMarks',function(request,response){//route for getting user bookmarks
    bookMark.getBookMarks(request.query,response);
});
router.get('/checkInOutlet',function(request,response){//route for checkin outlet
    checkIn.checkInOutlet(request.query,response);
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
router.post('/getToken',function(request,response){//route for getting new token when old expires
    auth.getToken(request.body,response)
});
router.post('/verifyToken',function(request,response){
    utility.verifyToken(request.body.access_token,'access',response,function(){
        response.send("token valid");
    });
});
router.get('/outlet',function(req,res){//route for getting outlet profile 
    var user_id = req.params.id;
    var user = utility.userInfo('57e22443151de91d63c35987');
    console.log(user);
    res.send(user);
});
module.exports = router;