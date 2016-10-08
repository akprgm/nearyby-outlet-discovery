module.exports = {
  app:{
    port:5000
  },
  webApp:{

  },
  secretKey: 'skynet@faagio',
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