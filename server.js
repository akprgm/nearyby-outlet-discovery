var Express = require('express');//getting express routing module
var app = Express();//creating app instance of Express router
app.all('/',function(req,res){
    res.send("hello world");
    console.log("server started");
})
app.listen(5000,function(){
    console.log("server listening on port 5000");
})
