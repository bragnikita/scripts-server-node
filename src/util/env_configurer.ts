import * as dotenv from "dotenv";
import expand from "dotenv-expand";

export class EnvConfigurer {
    constructor() {
    }

    configure = (dotenvFile: string = './.env') => {
        const env = dotenv.config({
            path: dotenvFile,
            debug: process.env.DEBUG === 'true',
        });
        expand(env);
    }
}