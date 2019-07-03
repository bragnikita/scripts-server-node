import * as dotenv from "dotenv";
import expand from "dotenv-expand";

const env = dotenv.config({debug: process.env.DEBUG === 'true'});
expand(env);
