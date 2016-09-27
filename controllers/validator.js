class Validate{
    static email(email){

    }
    static token(token){

    }
    static userId(id){

    }
    static latLong(lat,long){

    }
    static offset(offset){
        if(typeof(offset)!=number && offset >=0){
            return false;
        }
    } 
}