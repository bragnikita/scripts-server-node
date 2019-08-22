import express from "express";
import {getDatabase} from "../util/database";
import logger from "../util/logger";
import {ObjectId} from "bson";
import Joi from "@hapi/joi";
import {schemaValidate} from "../middleware/validation";
import {byId} from "../models/utils";
import {NotFound} from "../models/errors";
import expressAsyncHandler = require("express-async-handler");

const router = express.Router();

const col = async () => (await getDatabase()).chara_lists;

export const Schema = Joi.object().keys({
    title: Joi.string().min(2).required(),
    items: Joi.array().items(Joi.string().min(1)).default([]),
});

router.post('/', expressAsyncHandler(async (req, res, next) => {
    const json = schemaValidate(Schema, req);
    json.user_id = req.user.id;
    const c = await col();
    const result = await c.insertOne(json);
    const id = result.insertedId.toHexString();
    logger.debug('new list saved with id=%s', id);
    res.status(201).json({id: id})
}));

router.put('/:id', expressAsyncHandler(async (req, res, next) => {
    const json = schemaValidate(Schema, req);
    json.user_id = req.user.id;
    const c = await col();
    const result = await c.updateOne(byId(req.params.id), {$set: json});
    if (result.matchedCount == 0) {
        throw new NotFound();
    }
    res.sendStatus(200);
}));

router.get('/:id', expressAsyncHandler(async (req, res) => {
    const c = await col();
    try {
        const result = await c.findOne({_id: new ObjectId(req.params['id'])});
        return res.status(200).json({
            item: result
        });
    } catch (e) {
        return res.sendStatus(404);
    }
}));

router.get('/', expressAsyncHandler(async (req, res) => {
    const c = await col();
    const result = await c.find({userId: req.userId}).toArray();
    return res.status(200).json({
        items: result
    });
}));

export default router;