import {getDatabase} from "../util/database";
import {ObjectId} from "bson";
import Joi, {number} from "@hapi/joi";
import {BadRequest, NotFound} from "./errors";
import {SchemaId as CategoryId} from "./categories";
import {assertParamExists, byId, OrderMap, reorderChildren, ServiceContext} from "./utils";

export const ScriptTypes = [
    'battle', 'page'
];

export const SchemaId = Joi.string();

export class ScriptsModel {

    context: ServiceContext;

    constructor(context: ServiceContext) {
        this.context = context;
    }

    listing = async (filter: any) => {
        const db = await getDatabase();
        return await db.scripts
            .find(filter).project({content: 0})
            .sort({index: 1}).toArray()
    };

    listCategoryScriptsContent = async (categoryId: string) => {
        const db = await getDatabase();
        return await db.scripts
            .find({categoryId: categoryId})
            .sort({index: 1}).toArray()
    };

    getOne = async (id: string) => {
        const db = await getDatabase();
        const res = await db.scripts.findOne({_id: new ObjectId(id)});
        if (!res) throw new NotFound();
        return res;
    };

    update = async (id: string, json: any) => {
        assertParamExists(id);
        const db = await getDatabase();
        const res = await db.scripts.updateOne(byId(id), {$set: json});
        if (res.matchedCount === 0) {
            throw new NotFound();
        }
        return true;
    };

    create = async (json: any) => {
        const db = await getDatabase();
        const res = await db.scripts.insertOne(json);
        return res.insertedId;
    };

    delete = async (id: string) => {
        assertParamExists(id);
        const db = await getDatabase();
        const res = await db.scripts.deleteOne(byId(id));
        if (res.deletedCount == 0) {
            throw new NotFound()
        }
        return true;
    };

    reorderChildren = async (ids: OrderMap) => {
        const db = await getDatabase();
        return await reorderChildren(ids, db.scripts);
    }


}