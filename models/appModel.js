var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var userSchema = new Schema({
    name: {type:String, required:true},
    email: {type:String, lowercase:true},
    image: {type:String},
    gender: {type:String, enum:["m","f",""], default:"f"},
    firebase_token: {type:String},
    refresh_token: {type:String, required:true, unique:true},
    city : {type:String, default:""},
    news_letter: {type:Boolean, default:false},
    status : {type:Boolean, default:false},
    last_location: {type:String, default:""},
    joining_date: {type:Number, required:true},
    last_active: {type:Number, required:true},
    auth_type: {type:String, enum:["faagio","google","facebook"]},
    password: {type:String, default:""},
    profile_status: {type:String, default:""},
    social_id :{type:String, default:""},
    phone: [String],
    rating: {type:Number,default:0},
    review: {type:Number,default:0},
    image_uploaded: {type:Number,default:0},
    check_in: {type:Number,default:0},
    followedProfiles: [{type:mongoose.Schema.Types.ObjectId, required:true}],
    likedOutlets: [{type:mongoose.Schema.Types.ObjectId, required:true}] 
},{ collection: 'users' });
var outletSchema = new Schema({
    email: {type:String, required:true, unique:true},
    password: {type:String, required:true},
    name: {type:String, required:true},
    address: {type:String, required:true},
    locality: {type:String, required:true},
    zones: {type:String, required:true},
    region: {type:String, required:true},
    near_by: {type:String, required:true},
    page_url: {type:String, required:true},
    cost_rate: {type:Number, required:true},
    cover_image: {type:String, required:true},
    outlet_owner: {type:String, required:true},
    outlet_time: {type:String},
    website: {type:String, required:true},
    phone_no: {type:String, required:true},
    video: {type:String, required:true},
    did_you_know: {type:String, required:true},
    parking: {type:String, required:true},
    authorised_dealer: {type:String, required:true},
    brand_desc: {type:String, required:true},
    brands: {type:String, required:true},
    category: {type:String, required:true},
    user_name: {type:String, required:true},
    location: [Number,Number],
    star: {type:Number, required:true},
    rating: {type:Number, required:true},
    contacts: [String],
    outlet_type: [{type:String, required:true}],
    timings: {
        sunday: {type:String, required:true},
        monday: {type:String, required:true},
        tuesday: {type:String, required:true},
        wednesday: {type:String, required:true},
        thursday: {type:String, required:true},
        friday: {type:String, required:true},
        saturday: {type:String, required:true}
    },
    outlet_accept: [String],
    about: {type:String, required:true},
    tags: [String],
    gender: [String],
    labels: {
    },
},{ collection: 'outlets' });
var ratingSchema = new Schema({
    user_id: {type:mongoose.Schema.Types.ObjectId, required:true},
    outlet_id: {type:mongoose.Schema.Types.ObjectId, required:true},
    category: {type:String, required:true, enum:["book","cloth","consumer","watch"]},
    date: {type:Number,required:true},
    star : {type:Number,required:true},
    date: {type:Number, required:true},
},{collection: 'ratings'});
var reviewSchema = new Schema({
    user_id: {type:mongoose.Schema.Types.ObjectId, required:true},
    outlet_id: {type:mongoose.Schema.Types.ObjectId, required:true},
    review: {type:String, default:""},
    images: [mongoose.Schema.Types.ObjectId],
    comments: [mongoose.Schema.Types.ObjectId],
    likes: [mongoose.Schema.Types.ObjectId],
    category: {type:String, required:true, enum:["book","cloth","consumer","watch"]},
    date: {type:Number,required:true},
    star : {type:Number,required:true},
    helpful: {type:Number,default:0},
    lol: {type:Number,default:0},
    awesome: {type:Number,default:0},
    date: {type:Number, required:true},
},{collection: 'reviews'});
var bookMarkSchema = new Schema({
    outlet_id: {type:mongoose.Schema.Types.ObjectId, required:true},
    user_id: {type:mongoose.Schema.Types.ObjectId, required:true},
    category: {type:String, required:true},
    date: {type:Number, required:true},
},{ collection: 'bookMarks' });
var checkInSchema = new Schema({
    outlet_id: {type:mongoose.Schema.Types.ObjectId, required:true},
    user_id: {type:mongoose.Schema.Types.ObjectId, required:true},
    category: {type:String, required:true, enum:["book","cloth","consumer","watch"]},
    public: {type:Boolean, required:true, default:true},
    date: {type:Number, required:true},
},{ collection: 'checkIns' });
var imageSchema = new Schema({
    outlet_id: {type:mongoose.Schema.Types.ObjectId, required:true},
    user_id: {type:mongoose.Schema.Types.ObjectId, required:true},
    category: {type:String, required:true, enum:["book","cloth","consumer","watch"]},
    image: {type:String, required:true},
    uploaded_by: {type:String, required:true, enum:["admin","outlet","user"]},
    date: {type:Number, require:true},
},{ collection: 'images' });
var reviewCommentSchema = new Schema({
    review_id: {type:mongoose.Schema.Types.ObjectId, required:true},
    user_id: {type:mongoose.Schema.Types.ObjectId, required:true},
    comment: {type:String, required:true},
    date: {type:Number, required:true},
},{ collection: 'reviewComments' });
var reviewLikeSchema = new Schema({
    review_id: {type:mongoose.Schema.Types.ObjectId, required:true},
    user_id: {type:mongoose.Schema.Types.ObjectId, required:true},
    like: {type:Boolean, required:true, default:true},
    date: {type:Number, required:true},
},{ collection: 'reviewLikes' });
var imageCommentSchema = new Schema({
    image_id: {type:mongoose.Schema.Types.ObjectId, required:true},
    user_id: {type:mongoose.Schema.Types.ObjectId, required:true},
    comment: {type:String, required:true},
    image_type: {type:String,default:""},
    date: {type:Number, required:true},
},{ collection: 'imageComments' });
var imageLikeSchema = new Schema({
    image_id: {type:mongoose.Schema.Types.ObjectId, required:true},
    user_id: {type:mongoose.Schema.Types.ObjectId, required:true},
    image_type: {type:String, default:""},
    date: {type:Number, required:true},
},{ collection: 'imageLikes' });
var errorReportSchema = new Schema({
    outlet_id: {type:mongoose.Schema.Types.ObjectId, required:true},
    user_id: {type:mongoose.Schema.Types.ObjectId, required:true},
    category: {type:String, required:true, enum:["book","cloth","consumer","watch"]},
    header: {type:Boolean, required:true, default:false},
    about: {type:Boolean, required:true, default:false},
    stm: {type:Boolean, required:true, default:false},
    timing: {type:Boolean, required:true, default:false},
    labels: {type:Boolean, required:true, default:false},
    reviews: {type:Boolean, required:true, default:false},
    tags: {type:Boolean, required:true, default:false},
    date: {type:Number, required:true}
},{ collection: 'errorReports' });
var shutdownReportSchema = new Schema({
    outlet_id: {type:mongoose.Schema.Types.ObjectId, required:true},
    user_id: {type:mongoose.Schema.Types.ObjectId, required:true},
    category: {type:String, requsired:true, enum:["book","cloth","consumer","watch"]},
    date: {type:Number, required:true}        
},{ collection: 'shutdownReports' });
mongoose.model('user',userSchema);
mongoose.model('outlet',outletSchema);
mongoose.model('rating',ratingSchema);
mongoose.model('review',reviewSchema);
mongoose.model('bookMark',bookMarkSchema);
mongoose.model('checkIn',checkInSchema);
mongoose.model('image',imageSchema);
mongoose.model('reviewComment',reviewCommentSchema);
mongoose.model('reviewLike',reviewLikeSchema);
mongoose.model('imageComment',imageCommentSchema);
mongoose.model('imageLike',imageLikeSchema);
mongoose.model('errorReport',errorReportSchema);
mongoose.model('shutdownReport',shutdownReportSchema);

    
