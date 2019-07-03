import express from "express";
import expressAsyncHandler = require("express-async-handler");
import {getDatabase} from "../util/database";
import logger from "../util/logger";
import {ObjectId} from "bson";
import paperwork from "paperwork";

const router = express.Router();

const col = async () => (await getDatabase()).db().collection('chara_lists');

router.post('/', paperwork.accept({
    title: String,
    items: [String],
}), expressAsyncHandler(async (req, res, next) => {
    const json = req.body;
    if (!json.items || !json.title) {
        return res.sendStatus(400)
    }

    const c = await col();
    const result = await c.insertOne(json);
    const id = result.insertedId.toHexString();
    logger.debug('new list saved with id=%s', id);
    res.status(200).json({id: id})
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

export default router;