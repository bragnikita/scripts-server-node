import {getDatabase} from "../util/database";
import {ObjectId} from "bson";
import Joi, {number} from "@hapi/joi";
import {NotFound} from "./errors";

export const CategoryTypes = [
    'general', 'story', 'episode', 'battle', 'chapter'
];

export const SchemaId = Joi.string();

export const Schema = Joi.object().keys({
    title: Joi.string().min(1).max(100).error(() => 'title must not be empty'),
    description: Joi.string(),
    index: Joi.number().default(0),
    parentId: SchemaId,
    category_type: Joi.string().allow(...CategoryTypes).default('general'),
    story_type: Joi.string().token(),
    contributors: Joi.array().items(Joi.string()).unique().default([])
});

type OrderMap = { [key: string]: number };

export class CategoriesModel {

    getRoot = async () => {
        const db = await getDatabase();
        return await db.categories.findOne({ parentId: null });
    };

    getAll = async (parentId?: string) => {
        const db = await getDatabase();
        const filter = parentId ? { parentId } : {};
        return await db.categories.find(filter).sort({index: 1}).toArray()
    };

    getOne = async (id: string) => {
        const db = await getDatabase();
        const cat = await db.categories.findOne({_id: new ObjectId(id)})
        if (!cat) {
            throw new NotFound('Category not found')
        }
        return cat;
    };

    updateOne = async (id: string, json: any) => {
        const db = await getDatabase();
        const res = await db.categories.updateOne(
            {_id: new ObjectId(id)}, {$set: json});
        if (res.matchedCount === 0) {
            throw NotFound
        }
        return true;
    };

    create = async (json: any) => {
        const db = await getDatabase();
        if (!json.parentId) {
            json.parentId = (await this.getRoot())._id.toHexString()
        }
        const res = await db.categories.insertOne(json);
        return res.insertedId.toHexString();
    };

    delete = async (id: string) => {
        const db = await getDatabase();
        await db.categories.deleteOne({_id: new ObjectId(id)})
    };

    deleteAll = async () => {
        const db = await getDatabase();
        await db.categories.deleteMany({})
    };

    get = async (filter: any) => {
        const db = await getDatabase();
        return await db.categories.find(filter).toArray();
    };

    reorderChildren = async (ids: OrderMap) => {
        const db = await getDatabase();
        const bulk = Object.entries(ids).map(([id, idx]) => {
            if (!id) return null;
            return {updateOne: {filter: {_id: new ObjectId(id)}, update: {$set: {index: idx}}, upsert: false}}
        }).filter((v) => v != null);
        const res = await db.categories.bulkWrite(bulk, {ordered: false, w: 1});
        return res.matchedCount;
    }

}