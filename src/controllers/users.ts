import express from 'express';
import * as paperwork from "paperwork";
import {getDatabase} from "../util/database";
import expressAsyncHandler = require("express-async-handler");
import User from "../models/user";
import jwt from "jsonwebtoken";
import {Config} from "../util/config";

const usersRouter = express.Router();

usersRouter.post('/', paperwork.accept({
        username: String,
        password: String,
    }
), expressAsyncHandler(async (req, res, next) => {
    const json = req.body;

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

const authRouter = express.Router();

authRouter.post('/', paperwork.accept({
    username: String,
    password: String,
}), expressAsyncHandler((async (req, res, next) => {
    const json = req.body;
    const db = await getDatabase();

    const user = await db.users.findOne({name: json.username})
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