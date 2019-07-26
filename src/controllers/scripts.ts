import express from 'express';
import Joi from "@hapi/joi";
import {SchemaId as CategoryId} from "../models/categories";
import {schemaValidate} from "../middleware/validation";
import {ScriptsModel, ScriptTypes} from "../models/scripts";
import expressAsyncHandler = require("express-async-handler");

export const router = express.Router();

const Schema = Joi.object().keys({
    title: Joi.string().min(1).max(100).error(() => 'title must not be empty'),
    scriptType: Joi.string().allow(ScriptTypes).default('battle'),
    categoryId: CategoryId.required(),
    index: Joi.number().default(0),
    content: Joi.string(),
});

const PostSchema = Joi.object().keys({
    item: Schema,
});

router.get('/:id', expressAsyncHandler(async (req, res, next) => {
    const model = new ScriptsModel();
    return res.status(200).send(model.getOne(req.params.id));
}));

router.post('/', expressAsyncHandler(async (req, res, next) => {
    const json = schemaValidate(PostSchema, req);
    const model = new ScriptsModel();
    const id = await model.create(json.item);
    return res.status(201).send({
        message: 'created',
        id: id,
    });
}));

router.put('/:id', expressAsyncHandler(async (req, res, next) => {
    const json = schemaValidate(PostSchema, req)
    const model = new ScriptsModel();
    await model.update(req.params.id, json.item);
    return res.sendStatus(200)
}));

router.delete('/:id', expressAsyncHandler(async (req, res, next) => {
    const model = new ScriptsModel();
    await model.delete(req.params.id);
    return res.sendStatus(200);
}));

router.get('/:id/some', expressAsyncHandler(async (req, res, next) => {

}));