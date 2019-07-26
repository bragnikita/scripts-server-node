import express from 'express';
import * as paperwork from "paperwork";
import {getDatabase} from "../util/database";
import expressAsyncHandler = require("express-async-handler");
import User from "../models/user";
import jwt from "jsonwebtoken";
import {Config} from "../util/config";
import Joi, {number} from "@hapi/joi";
import {schemaValidate} from "../middleware/validation";
import user from "../models/user";
import {AccessViolation} from "../models/errors";

const usersRouter = express.Router();

export const SchemaUser = Joi.object().keys({
    username: Joi.string().min(2).required(),
    password: Joi.string().min(4).required(),
    displayedName: Joi.string(),
});

usersRouter.post('/', expressAsyncHandler(async (req, res, next) => {
    const json = schemaValidate(SchemaUser, req);

    const db = await getDatabase();
    const b = await db.users.find({username: json.username});
    const c = await b.count();
    if (c > 0) {
        return res.status(400).json({
            code: 'user_already_exists',
            message: 'User already exists'
        })
    }
    json.password_hash = await User.hashed_password(json.password);
    delete json.password;
    const id = (await db.users.insertOne(json)).insertedId.toHexString();
    return res.status(201).json({
        code: 'user_registred',
        id: id
    })
}));

usersRouter.get('/me', expressAsyncHandler( async (req, res, next) => {
    if (!req.user) throw new AccessViolation();
    const user = req.user as User;
    return res.status(200).send({
        username: user.username,
        isAdmin: user.username === 'admin'
    })
}));

export const SchemaAuth = Joi.object().keys({
    username: Joi.string().min(2).required(),
    password: Joi.string().min(4).required(),
});

const authRouter = express.Router();

authRouter.post('/', expressAsyncHandler((async (req, res, next) => {
    const json = schemaValidate(SchemaAuth, req);
    const db = await getDatabase();

    const user = await db.users.findOne({username: json.username});
    if (!user) {
        return res.status(401).json({
            code: 'user_not_found',
        })
    }
    if (!(await User.compare_passwords(user.password_hash, json.password))) {
        return res.status(401).json({
            code: 'username_pwd_not_match'
        })
    }
    const token = jwt.sign({userId: user._id.toHexString()}, Config().jwtKey);
    return res.status(201).json({
        token: token,
    });
})));


export {
    authRouter,
    usersRouter,
};