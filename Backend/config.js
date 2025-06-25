// config.js - Central configuration file
export default {
  jwt: {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || 'your_access_token_secret_32_characters_long_12345',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'your_refresh_token_secret_32_characters_long_67890',
    verificationTokenSecret: process.env.VERIFICATION_TOKEN_SECRET || 'your_verification_token_secret_32_characters_long_abcde',
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
    verificationTokenExpiry: '24h'
  },
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
};