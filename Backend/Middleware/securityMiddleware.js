import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';

export const setSecurityHeaders = helmet();

export const preventNoSQLInjection = mongoSanitize();

export const preventXSS = xss();

export const preventHTTPParamPollution = hpp({
  whitelist: [
    'duration',
    'ratingsQuantity',
    'ratingsAverage',
    'maxGroupSize',
    'difficulty',
    'price'
  ]
});

export const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};