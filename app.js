var Express = require('express');//getting express routing module
var favicon = require('serve-favicon');
var morgan = require('morgan');
var bodyParsar = require('body-parser');
var app = Express();//creating app instance of Express router
app.all('/',function(req,res){
    var utility = require('./controllers/utility');
    res.send();
    console.log("server started");
})
app.listen(5000,function(){
    console.log("server listening on port 5000");
}) 
