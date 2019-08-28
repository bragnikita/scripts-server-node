import {EnvConfigurer} from "./env_configurer";
import logger from "./logger";
import {classToPlain} from "class-transformer";

const instance = new EnvConfigurer();

const loadEnv = (dotenvFile: string = './.env') => {
  instance.configure(dotenvFile);
  logger.debug(`
  === ENVIRONMENT ===\n
  ${JSON.stringify(classToPlain(Config()), null, 2)}\n
  ===
  `);
};

export { loadEnv }

export const Config = () => ({
  salt: process.env.SALT || "69uhjf72t32o4K(k23h(_y",
  saltRounds: 10,
  jwtKey: process.env.JWT_TOKEN_KEY,
  debug: process.env.DEBUG === 'true',
  mongo_url: process.env.MONGODB_URL,
  default_admin_name: process.env.DEFAULT_ADMIN_NAME,
  default_admin_password:  process.env.DEFAULT_ADMIN_PASSWORD,
});