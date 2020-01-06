import express from 'express';
import {ObjectId} from "bson";
import {BadRequest} from "./errors";
import {Collection} from "mongodb";
import User from "./user";


export type OrderMap = { [key: string]: number }

export const byId = (id: string | ObjectId) => {
    if (typeof id == "string") {
        return {_id: new ObjectId(id)}
    } else {
        return {_id: id}
    }
};

export const assertParamExists = (param: any, message?: string) => {
    if (param === 0) return;
    if (!param) {
        throw new BadRequest(message || "Parameter assertion failed")
    }
};

export const reorderChildren = async (ids: OrderMap, collection: Collection<any>) => {
    if (Object.keys(ids).length === 0) return 0;
    const bulk = Object.entries(ids).map(([id, idx]) => {
        if (!id) return null;
        return {updateOne: {filter: {_id: new ObjectId(id)}, update: {$set: {index: idx}}, upsert: false}}
    }).filter((v) => v != null);
    const res = await collection.bulkWrite(bulk, {ordered: false, w: 1});
    return res.matchedCount;
};

export class ServiceContext {
    user: User;

    constructor(user: User) {
        this.user = user;
    }

    get isAnon() {
        return !!this.user.id;
    }
}

export const newCtx = (req: express.Request) => {
    let user;
    if (!req.user) {
        user = new User('anon')
    }
    return new ServiceContext(req.user || user);
};