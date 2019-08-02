import express from 'express';
import * as paperwork from "paperwork";
import {getDatabase} from "../util/database";
import expressAsyncHandler = require("express-async-handler");
import User from "../models/user";
import jwt from "jsonwebtoken";
import {Config} from "../util/config";
import Joi, {number} from "@hapi/joi";
import {schemaValidate, schemaValidateJson} from "../middleware/validation";
import user from "../models/user";
import {AccessViolation, NotFound} from "../models/errors";
import {ObjectId} from "bson";

const usersRouter = express.Router();

export const SchemaUser = Joi.object().keys({
    username: Joi.string().min(2).required(),
    password: Joi.string().min(4).required(),
    displayedName: Joi.string(),
});

usersRouter.get('/', expressAsyncHandler(async (req, res, next) => {
    const db = await getDatabase();
    return res.status(200).send({items: await db.users.find({}).toArray()});
}));

usersRouter.post('/', expressAsyncHandler(async (req, res, next) => {
    const json = schemaValidateJson(SchemaUser, req.body.item);

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

usersRouter.get('/me', expressAsyncHandler(async (req, res, next) => {
    if (!req.user) throw new AccessViolation();
    const user = req.user as User;
    return res.status(200).send({
        username: user.username,
        isAdmin: user.username === 'admin'
    })
}));

usersRouter.get('/contributors', expressAsyncHandler(async (req, res, next) => {
    const db = await getDatabase();
    const json = await db.users.find({
        '$and': [
            {'username': {'$ne': 'admin'}},
            {'username': {'$ne': req.user.username}},
        ]
    }).project({
        password_hash: 0,
    }).toArray();
    return res.status(200).send({
        items: json,
    });
}));

usersRouter.get('/find/:param/:val', expressAsyncHandler(async (req, res, next) => {
    const db = await getDatabase();
    if (['id', 'username'].indexOf(req.params.param) == -1) throw new NotFound();
    let filter:any = {};
    if (req.params.param === "id") {
        filter['_id'] = new ObjectId(req.params.val);
    } else {
        filter[req.params.param] = req.params.val;
    }
    const json = await db.users.findOne(filter);
    if (!json) throw new NotFound();
    return res.status(200).send({item: json})
}));

usersRouter.put('/:id', expressAsyncHandler(async (req, res, next) => {
    const db = await getDatabase();
    const user = schemaValidateJson(SchemaUser, req.body.item);
    const json = {
        ...user,
    };
    delete json.password;
    json.password_hash = await User.hashed_password(user.password);
    const {matchedCount} = await db.users.updateOne({_id: new ObjectId(req.params.id)}, {"$set": json})
    if (matchedCount == 0) {
        throw new NotFound();
    }
    return res.sendStatus(200)
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