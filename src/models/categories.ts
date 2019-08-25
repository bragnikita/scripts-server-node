import {getDatabase} from "../util/database";
import {ObjectId} from "bson";
import Joi, {number} from "@hapi/joi";
import {NotFound} from "./errors";
import {reorderChildren, ServiceContext} from './utils';
import {
    classToClassFromExist,
    classToPlain,
    classToPlainFromExist, Exclude,
    plainToClass,
    plainToClassFromExist
} from 'class-transformer';

export const CategoryTypes = [
    'general', 'story', 'episode', 'battle', 'chapter'
];

export type CategoryModel = {
    title: string,
    description: string,
    index: number,
    parentId: string,
    category_type: string,
    story_type?: string,
    contributors: string[]
};

export const SchemaId = Joi.string();

export const Schema = Joi.object().keys({
    title: Joi.string().trim().min(1).max(100).error(() => 'title must not be empty'),
    description: Joi.string().allow(''),
    index: Joi.number().default(0),
    parentId: SchemaId,
    category_type: Joi.string().allow(...CategoryTypes).default('general'),
    story_type: Joi.string().token().allow(''),
    contributors: Joi.array().items(Joi.string()).unique().default([])
});

type OrderMap = { [key: string]: number };

export class Category {
    id?: string;
    attrs: CategoryModel = {
        category_type: "",
        contributors: [],
        description: "",
        index: 0,
        parentId: "",
        story_type: undefined,
        title: ""
    };


    constructor(model?: CategoryModel, id?: string) {
        if (model)
            this.attrs = model;
        this.id = id;
    }

    static fromJson(json: any, id?: string) {
        const c = new Category();
        c.id = id;
        plainToClassFromExist(c.attrs, json);
        return c;
    }
    toJson = ():any => {
        return classToPlain(this.attrs)
    };
    toDb = () => {
        const o = this.toJson();
        o._id = this.id;
        return o;
    };

    static fromDefault = (cb: (m: CategoryModel) => string | void, id?: string) => {
        const c = new Category();
        c.id = id;
        const newId = cb(c.attrs);
        if (newId) {
            c.id = newId;
        }
        return c
    }
}

class Policies {
    context: ServiceContext;
    constructor(ctx: ServiceContext) {
        this.context = ctx;
    }
}

export class CategoriesService {
    context: ServiceContext;

    constructor(context: ServiceContext) {
        this.context = context;
    }

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
        const cat = await db.categories.findOne({_id: new ObjectId(id)});
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
            throw new NotFound();
        }
        return true;
    };

    create = async (json: any) => {
        console.log(json);
        const db = await getDatabase();
        if (!json.parentId) {
            json.parentId = (await this.getRoot())._id.toHexString()
        }
        json.creator = {
            username: this.context.user.username,
            id: this.context.user.id || null,
        };
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
        return await reorderChildren(ids, db.categories);
    };

    getParents = async (childId: string ) => {
        const db = await getDatabase();
        const parents = [];
        const child = await this.getOne(childId);
        parents.push(child);
        let parentId = child.parentId;
        while (parentId) {
            const parent = await this.getOne(parentId);
            parents.push(parent);
            parentId = parent.parentId;
        }
        return parents.reverse();
    }

}