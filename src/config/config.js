import { config as configEnv } from "dotenv";

configEnv();

const _config = {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
};

export const config = Object.freeze(_config);
