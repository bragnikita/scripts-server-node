import express from 'express';
import expressAsyncHandler = require("express-async-handler");
import Joi, {number} from "@hapi/joi";
import {CategoriesModel, Schema as CatSchema, SchemaId} from "../models/categories";
import {schemaValidate} from "../middleware/validation";

const PostJsonSchema = Joi.object().keys({
    item: CatSchema,
});
const PutJsonSchema = Joi.object().keys({
    item: CatSchema,
    reorder_categories: Joi.object().pattern(SchemaId, Joi.number()),
    reorder_scripts: Joi.object().pattern(Joi.string(), Joi.number()),
});

const router = express.Router();

router.get('/', expressAsyncHandler(async (req, res, next) => {
    const model = new CategoriesModel();
    return res.status(200).send(await model.getAll())
}));
router.get('/:id', expressAsyncHandler(async (req, res, next) => {
    const model = new CategoriesModel();
    const json = await model.getOne(req.params.id);
    return res.status(200).send(json)
}));
router.put('/:id', expressAsyncHandler(async (req, res, next) => {
    const value = schemaValidate(PutJsonSchema, req);
    const model = new CategoriesModel();
    if (value.item) {
        await model.updateOne(req.params.id, value.item)
    }
    if (value.reorder_categories) {
        await model.reorderChildren(value.reorder_categories)
    }
    if (value.reorder_scripts) {
        // TODO
    }
    return res.status(200).send({
        message: 'updated',
    });
}));
router.post('/', expressAsyncHandler(async (req, res, next) => {
    const { value, error } = PostJsonSchema.validate(req.body);
    if (error) {
        return res.status(400).send({
            message: error.message,
            details: error.details,
        })
    }
    const model = new CategoriesModel();
    const insertedId = await model.create(value.item);
    return res.status(201).send({
        message: 'created',
        id: insertedId,
    });
}));
router.delete('/:id', expressAsyncHandler(async (req, res, next) => {
    const model = new CategoriesModel();
    await model.delete(req.params.id);
    return res.sendStatus(200);
}));

export { router }