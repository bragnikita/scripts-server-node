import 'reflect-metadata';

import {Config, loadEnv} from "./util/config";

import express, {NextFunction, Request, Response} from "express"
import bodyParser from "body-parser";
import errorHandler from "errorhandler";
import {ValidationError} from "@hapi/joi";

import cors from 'cors';
import logger from "./util/logger";
import {checkDatabase, getDatabase, validateDatabase} from "./util/database";
import uploadRoutes, {getStatic} from "./controllers/upload";
import charaRoutes from "./controllers/chara_lists";
import {basicAuthMiddleware, extractUserMiddleware, needAuthentication, providerMiddleware} from "./middleware/auth";
import {compose} from "compose-middleware";

import User from "./models/user";
import {ObjectId} from "bson";

loadEnv();

const loggerMw = (req: Request, res: Response, next: NextFunction) => {
    res.on("finish", () => {
        if (req.method.toUpperCase() !== 'OPTIONS') {
            const username = req.user ? req.user.username : '-';
            logger.info('%s [%s] %s - %d', req.method.toUpperCase(), username, req.path, res.statusCode);
        }
    });
    next();
};

const mustAuthorized = compose([extractUserMiddleware(), basicAuthMiddleware(async (username: string) => {
    const db = await getDatabase();
    const user = await db.users.findOne({username: username});
    if (user) {
        return User.fromDb(user);
    } else {
        return null;
    }
}), providerMiddleware(async (userId?: string) => {
    if (userId) {
        const db = await getDatabase();
        const user = await db.users.findOne({_id: new ObjectId(userId)});
        if (!user) {
            logger.error("User not found for id=%s", userId)
        } else {
            return User.fromDb(user);
        }
    } else if (Config().debug) {
        const defaultUserName = process.env.DEFAULT_USER_NAME;
        if (defaultUserName) {
            const db = await getDatabase();
            const user = await db.users.findOne({username: defaultUserName});
            if (user) {
                return User.fromDb(user);
            }
            logger.error("Default user not found for name=%s", defaultUserName)
        } else {
            logger.error("No valid user id found in provided token and no default user is set");
        }
    }
    return null
}), needAuthentication()]);


// Express application middleware configuration
const app = express();

if (process.env.NODE_ENV !== 'production') {
    app.use('/images', getStatic());
}

app.use(cors());
app.use(bodyParser.json());
app.use(loggerMw);

// Routing
app.get('/', function (req: Request, res: Response) {
    res.send('hello world!!!')
});
app.use('/uploads', mustAuthorized, uploadRoutes);
app.use('/chara_lists', mustAuthorized, charaRoutes);
app.use('/users', mustAuthorized, require('./controllers/users').usersRouter);
app.use('/auth', require('./controllers/users').authRouter);
app.use('/categories', mustAuthorized, require('./controllers/categories').router);
app.use('/scripts', mustAuthorized, require('./controllers/scripts').router);
app.use('/reader', require('./controllers/reader').router);

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err.name === "ValidationError") {
        const error = err as ValidationError;
        return res.status(400).send({
            message: error.message,
            details: error.details,
        }).end();
    }
    if (err.constructor.name === 'NotFound') {
        logger.debug(err);
        return res.sendStatus(404);
    }
    if (err.constructor.name === 'AccessViolation') {
        return res.sendStatus(403);
    } else {
        next(err);
    }
});
app.use(errorHandler({
    log: (err, str, req, res) => {
        logger.error("%s  %s - %s", req.method.toUpperCase(), req.path, err.message || str, err)
    }
}));

// Environment validation
checkDatabase().then(() => {
    logger.info('Database connection established')
}).catch((e) => {
    logger.error("Could not connect the database. Exit", e);
    process.exit(1);
});

validateDatabase().then(() => {
    const ports = process.env.APP_PORT || 3000;
    app.listen(ports, () => {
        console.log('listening', ports)
    });
});


