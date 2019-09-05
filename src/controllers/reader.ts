import express from "express";
import expressAsyncHandler from "express-async-handler";
import {ScriptsModel} from "../models/scripts";
import {CategoriesService} from "../models/categories";
import {newCtx} from "../models/utils";
import logger from "../util/logger";
import {inspect} from "util";

export const router = express.Router();

router.get("/c/:id", expressAsyncHandler((async (req, res, next) => {
    const catId = req.params.id;
    const cModel = new CategoriesService(newCtx(req));
    const sModel = new ScriptsModel(newCtx(req));
    res.status(200).send({
        root: await cModel.getOne(catId),
        categories: await cModel.getAll(catId),
        scripts:  await sModel.listCategoryScriptsContent(catId),
    })
})));

router.get('/:id/:info((next|prev))', expressAsyncHandler(async (req, res, next) => {
    const service = new CategoriesService(newCtx(req));
    const targetId = req.params.id;
    const info = req.params.info;
    logger.debug(inspect(req.params));
    if (info === 'next') {
        const next = await service.getNext(targetId);
        if (!next) {
            return res.status(200).send({
                status: "last"
            })
        }
        return res.status(200).send({
            status: "ok",
            info: {
                id: next.id,
            }
        });
    }
    if (info === 'prev') {
        const prev = await service.getPrev(targetId);
        if (!prev) {
            return res.status(200).send({
                status: "first"
            })
        }
        return res.status(200).send({
            status: "ok",
            info: {
                id: prev.id,
            }
        });
    }
    return res.sendStatus(400);
}));