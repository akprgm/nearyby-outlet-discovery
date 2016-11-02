module.exports = {
    validateEmail: function email(email){
        if(typeof(email) == 'string'){
            var regex = new RegExp(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
            if(regex.test(email)){
                return true;
            }else{
                return false;
            }
        }else{
            return false;
        }
    },
    validatePassword: function password(password){
        if(typeof(password) == 'string'){
            var regex = new RegExp(/[A-Za-z]\w{7,15}$/);
            if(regex.test(password)){
                return true;
            }else{
                return false;
            }
        }
    },
    validateSocialId : function socialId(socialId){
        if(typeof(socialId) == 'string'){
            return true;
        }else{
            return false;
        }
    },
    validateToken: function token(token){
        if(typeof(token) == 'string'){
            return true;
        }else{
            return false;
        }
    },
    validateObjectId: function checkId(id){
        if(typeof(id) == 'string'){
            var regex = new RegExp(/^[a-f0-9]{24}$/);
            if(regex.test(id)){
                return true;
            }else{
                return false;
            }
        }else{
            return false;
        }
    },
    validateEmptyObject: function emptyObject(obj){
        return Object.keys(obj).length !== 0;
    },
    validateLatitudeLongitude: function latLong(latitude,longitude){
        if(typeof(latitude) == 'number' && typeof(longitude) == 'number'){
            return true;
        }else{
            return false;
        }
    },
    validateOffset: function offset(offset){
        if(typeof(offset) == 'number' && offset >=0){
            return true;
        }else{
            return false;
        }
    },
    validateCategory : function category(category){
        if(typeof(category) == 'string'){
            if(category === "book" || category === "cloth" || category === "consumer" || category === "watch"){
                return true;
            }else{
                return false;
            }
        }else{
            return false;
        }
    } 
}