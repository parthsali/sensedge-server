import { config as configEnv } from "dotenv";

configEnv();

const _config = {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRATION: process.env.JWT_EXPIRATION,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  BUCKET_NAME: process.env.BUCKET_NAME,
  BUCKET_REGION: process.env.BUCKET_REGION,
  ACCESS_KEY: process.env.ACCESS_KEY,
  SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY,
};

export const config = Object.freeze(_config);
