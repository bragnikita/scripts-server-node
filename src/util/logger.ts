import * as winston from "winston";
import {format} from "winston";
import logform from "logform";
import tripleBeam from "triple-beam";
import printf = format.printf;
import timestamp = format.timestamp;

const errorHunter = logform.format(info => {
    if (info.error) return info;

    const splat = info[tripleBeam.SPLAT] || [];
    info.error = splat.find((obj: any) => obj instanceof Error);

    return info;
});

const errorPrinter = logform.format(info => {
    if (!info.error) return info;

    // Handle case where Error has no stack.
    const errorMsg = info.error.stack || info.error.toString().substring(0, 200);
    info.message += `\n${errorMsg}`;

    return info;
});

const myformat = printf(({timestamp, level, message}) => {
    return `${timestamp} ${level}: ${message}`;
});

const logger = winston.createLogger({
    level: 'debug',
    format: format.combine(
        errorHunter(),
        format.splat(),
        errorPrinter(),
        timestamp(),
        myformat,
    ),
    transports: [
        //
        // - Write to all logs with level `info` and below to `combined.log`
        // - Write all logs error (and below) to `error.log`.
        //
        new winston.transports.File({filename: 'logs/error.log', level: 'error'}),
        new winston.transports.File({filename: 'logs/combined.log'})
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        //format: winstonConsoleFormat,
    }));
} else {
    // stdout logs are managed by PM2 in production environment
    logger.add(new winston.transports.Console({
        level: 'info',
        stderrLevels: ['error'],
    }));
}

export default logger;