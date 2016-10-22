module.exports = {
    app:{
        port:5000
    },
    webApp:{
    },
    secretKey: 'skynet@faagio',
    saltRounds: 10,
    ranking:{
        ratingPoint: 10,
        checkInPoint: 10,
        imagePoint: 10,
        reviewPoint: 30,
        levels: [0 ,150,300,500,800,1200,1700,2300,3000,4000,5000,6000,8000,99999999],
        titile:{
                a:[0,500,"THE ROOKIE"],
                b:[500,1700,"THE SHOPPER"],
                c:[1700,4000,"THE EXPERIENCED SHOPPER"],
                d:[4000,6000,"THE SHOPAHOLIC"],
                e:[8000,99999999,"THE AFICIONADO"]
            }
    },
    database:{
        host: '127.0.0.1',
        database: 'test',
        user: '',
        password: '',
        charset: 'utf8',
        url: 'mongodb://localhost:27017/test',
    },
    redis:{
        host:'127.0.0.1',
        user: '',
        password: '',
        port:6379,
    }
};