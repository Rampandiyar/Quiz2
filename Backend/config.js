export default {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  jwt: {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || 'default_access_token_secret',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'default_refresh_token_secret',
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d'
  },
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz-app',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    }
  },
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    username: process.env.EMAIL_USERNAME,
    password: process.env.EMAIL_PASSWORD
  },
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000'
};