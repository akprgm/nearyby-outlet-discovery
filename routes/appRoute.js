var Express = require('express');
var mongoose = require('mongoose');
var async = require('body-parser');
var utility = require('../controllers/utility');
var auth = require('../controllers/app/auth');
var router = Express.Router();
router.post('/login',function(req,res){
    return auth.login(req);
});
router.post('/register',function(req,res){
    auth.register(req.body,res);
});
router.get('/user',function(req,res){
    utility.userInfo('57e22443151de91d63c35987',function(user){
        if(user){
            res.send(user);
        }else{
            res.send("error");
        }
    });
});
var movieSchema = new mongoose.Schema({
    title: { type: String }
    , rating: String
    , releaseYear: Number
    , hasCreditCookie: Boolean
    , yoyo: [{a:Number,b:Number}]
    });
router.get('/db',function(req,res){
    

    // Compile a 'Movie' model using the movieSchema as the structure.
    // Mongoose also creates a MongoDB collection called 'Movies' for these documents.
    var Movie = mongoose.model('Movie', movieSchema);
    var ob = {
    title: 'Thor'
    , rating: 'PG-13'
    , releaseYear: '2011'  // Notice the use of a String rather than a Number - Mongoose will automatically convert this for us.
    , hasCreditCookie: true,
      yoyo:[{
          "a":1,
          "b":2
      }]
    }
    var thor = new Movie(ob);

    thor.save(function(err, thor) {
    if (err) return console.error(err);
        res.send("saved");
    });
})
router.get('/token',function(req,res){
});
router.get('/outlet',function(req,res){
    var user_id = req.params.id;
    var user = utility.userInfo('57e22443151de91d63c35987');
    console.log(user);
    res.send(user);
});
module.exports = router;