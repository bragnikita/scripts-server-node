import express from "express";
import expressAsyncHandler from "express-async-handler";
import {ScriptsModel} from "../models/scripts";
import {CategoriesModel} from "../models/categories";
import {newCtx} from "../models/utils";

export const router = express.Router();

router.get("/c/:id", expressAsyncHandler((async (req, res, next) => {
    const catId = req.params.id;
    const cModel = new CategoriesModel(newCtx(req));
    const sModel = new ScriptsModel();
    res.status(200).send({
        root: await cModel.getOne(catId),
        categories: await cModel.getAll(catId),
        scripts:  await sModel.listCategoryScriptsContent(catId),
    })
})));