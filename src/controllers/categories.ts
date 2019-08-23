import express from 'express';
import expressAsyncHandler = require("express-async-handler");
import Joi, {number} from "@hapi/joi";
import {CategoriesService, Schema as CatSchema, SchemaId} from "../models/categories";
import {schemaValidate} from "../middleware/validation";
import {ScriptsModel} from "../models/scripts";
import {newCtx} from "../models/utils";

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
    const model = new CategoriesService(newCtx(req));
    return res.status(200).send({ items: await model.getAll() })
}));
router.get('/:id', expressAsyncHandler(async (req, res, next) => {
    const model = new CategoriesService(newCtx(req));
    let id = req.params.id;
    if (id=== 'root') {
        id = (await model.getRoot())._id.toHexString();
    }
    const json = await model.getOne(id);
    return res.status(200).send({ item: json })
}));
router.get('/:id/children', expressAsyncHandler(async (req, res, next) => {
    await new CategoriesService(newCtx(req)).getOne(req.params.id);
    const categories = await new CategoriesService(newCtx(req)).getAll(req.params.id);
    const scripts = await new ScriptsModel().listing({ categoryId : req.params.id });
    return res.status(200).send({
        categories: categories,
        scripts: scripts,
    });
}));
router.put('/:id', expressAsyncHandler(async (req, res, next) => {
    const value = schemaValidate(PutJsonSchema, req);
    const model = new CategoriesService(newCtx(req));
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
    const {value, error} = PostJsonSchema.validate(req.body);
    if (error) {
        return res.status(400).send({
            message: error.message,
            details: error.details,
        })
    }
    const model = new CategoriesService(newCtx(req));
    const insertedId = await model.create(value.item);
    return res.status(201).send({
        message: 'created',
        id: insertedId,
    });
}));
router.delete('/:id', expressAsyncHandler(async (req, res, next) => {
    const model = new CategoriesService(newCtx(req));
    await model.delete(req.params.id);
    return res.sendStatus(200);
}));

export {router}