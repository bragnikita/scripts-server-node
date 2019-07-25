import {getDatabase} from "../util/database";
import {ObjectId} from "bson";
import Joi, {number} from "@hapi/joi";

export const CategoryTypes = [
    'general', 'story', 'episode', 'battle', 'chapter'
];

export const Schema = Joi.object().keys({
    title: Joi.string().min(1).max(100).error(() => 'title must not be empty'),
    description: Joi.string(),
    index: Joi.number().default(0),
    parentId: Joi.string().hex().optional(),
    category_type: Joi.string().allow(...CategoryTypes).default('general'),
    story_type: Joi.string().token(),
    contributors: Joi.array().items(Joi.string()).unique().default([])
});

type OrderMap = { [key: string]: number };

export class CategoriesModel {

    getAll = async () => {
        const db = await getDatabase();
        return await db.categories.find().sort({index: 1}).toArray()
    };

    getOne = async (id: string) => {
        const db = await getDatabase();
        return await db.categories.findOne({_id: new ObjectId(id)})
    };

    updateOne = async (id: string, json: any) => {
        const db = await getDatabase();
        const res = await db.categories.updateOne(
            {_id: new ObjectId(id)}, {$set: json});
        return res.result.ok == 1 && res.matchedCount == 1;
    };

    create = async (json: any) => {
        const db = await getDatabase();
        const res = await db.categories.insertOne(json);
        return res.insertedId.toHexString();
    };

    delete = async (id: string) => {
        const db = await getDatabase();
        await db.categories.deleteOne({_id: new ObjectId(id)})
    };

    deleteAll = async (id: string) => {
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