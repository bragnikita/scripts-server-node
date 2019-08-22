import {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import logger from "../util/logger";
import {tokenKey} from "../util/config";
import User from "../models/user";

type userLookup = (userId: string) => Promise<User>;

export const extractUserMiddleware = () => (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return next();
    }
    const [schema, token] = authHeader.split(" ");
    if (schema != "Bearer") {
        return next();
    }
    jwt.verify(token, tokenKey, ((err, decoded: any) => {
        if (decoded) {
            req.userId = decoded.userId;
            next();
        } else {
            res.sendStatus(401);
            // next(err);
        }
    }))
};

export const needAuthentication = () => (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        res.sendStatus(401);
    } else {
        next();
    }
};

export const providerMiddleware = (lookup: userLookup) => (req: Request, res: Response, next: NextFunction) => {
    if (req.user) {
        return next();
    }
    return lookup(req.userId).then((user) => {
        req.user = user;
        next();
    }).catch((err) => next(err));
};

export const basicAuthMiddleware = (lookup: userLookup) => (req: Request, res: Response, next: NextFunction) => {
    if (req.user || req.userId) {
        return next();
    }
    if (req.headers.authorization && req.headers.authorization.indexOf('Basic') > -1) {
        const base64Credentials =  req.headers.authorization.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [username, password] = credentials.split(':');
        return lookup(username).then((user) => {
            if (!user) {
                logger.info('user not found (%s)', username);
                next();
            } else {
                user.compare_passwords(password).then(res => {
                    if (res) {
                        req.user = user;
                        req.userId = user.id;
                    }
                    next();
                }).catch(next);
            }
        }).catch(next);
    }
    return next();
}