import express, {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import logger from "../util/logger";
import {tokenKey} from "../util/config";
import User from "../models/user";

type userLookup = (userId: string) => Promise<User>;

export const extractUserMiddleware = (lookup: userLookup) => (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return next();
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, tokenKey, ((err, decoded: any) => {
        if (decoded) {
            const id = decoded.userId;
            lookup(id).then((user: User) => {
                if (user) {
                    req.user = user;
                    req.params['userId'] = id;
                    return next()
                }
                return next();
            }).catch((err) => next(err));
        } else {
            logger.error(err);
            next(err);
        }
    }))
};

export const needAuthentication = () => (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        res.sendStatus(401);
    } else {
        next()
    }
};

export const providerMiddleware = (lookup?: () => Promise<User>) => (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'development' && lookup && !req.user) {
        lookup().then((user) => {
            req.user = user;
            logger.info("using fake user %s", user.username);
            next();
        }).catch((err) => next(err))
    } else {
        next()
    }
};