import * as dotenv from "dotenv";
import expand from "dotenv-expand";

// const env = dotenv.config({debug: process.env.DEBUG === 'true'});
// expand(env);

export const tokenKey = process.env.JWT_TOKEN_KEY;

export const isDebugMode = () => process.env.DEBUG === 'true';

export const Config = () => ({
  salt: process.env.SALT || "69uhjf72t32o4K(k23h(_y",
  saltRounds: 10,
  jwtKey: process.env.JWT_TOKEN_KEY,
});