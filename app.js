var Express = require('express');//getting express routing module
var favicon = require('serve-favicon');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var redis = require('redis');
var env = require('./env/development');
var appRouter = require('./routes/appRoute');
var utility = require('./controllers/utility');
var validator = require('./controllers/validator');
var app = Express();//creating app instance of Express router
mongoose.Promise = global.Promise;
mongoose.connect(env.database.url);
var client = redis.createClient(env.redis.port, env.redis.host, {no_ready_check: true});
/*client.auth(env.redis.password,function(err){
    if(err){
        console.log(err);
    }
});*/
client.on('connect', function() {
    console.log('Connected to Redis');
});
client.on('error', function(err) {
    console.log('Connection failed to Redis');
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));
app.use(function(err,request, response, next) {//checking for bad request error
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        utility.badRequest(response);
    }else{
        next();
    }
});
app.use(appRouter);
app.listen(5000,function(){
    console.log("server listening on port 5000");
}) 
