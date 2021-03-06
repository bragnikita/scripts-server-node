import {Db, MongoClient, ObjectId} from "mongodb";
import logger from "./logger";
import User from "../models/user";
import {Config} from "./config";
import {Category} from "../models/categories";

let db: MongoClient = undefined;

export const getDbClient = async () => {
    if (!db) {
        db = await connect();
    }
    if (db.isConnected()) {
        return db;
    } else {
        db = await connect();
        return db;
    }
};

const connect = () => MongoClient.connect(Config().mongo_url, {useNewUrlParser: true});

export const closeDatabase = async () => {
    if (db) {
        await db.close()
    }
};

export const checkDatabase = async () => {
    return getDbClient().then((database) => {
        if (database.isConnected()) {
            // check whether master data is in place
            return true;
        }
        return false;
    }).catch((e) => {
        logger.error(e);
        return false;
    })
};

export const validateDatabase = async (database?: DB) => {
    const db = database || await getDatabase();
    const name = Config().default_admin_name || "admin";
    const password = Config().default_admin_password || "changeme";

    const admin = await db.users.findOne({admin: true});
    if (!admin) {
        logger.info('Default user %s not found, temporary user with password "changeme" will be created', name);
        await db.users.updateOne({username: name}, { $set: {
            username: name,
            admin: true,
            password_hash: await User.hashed_password(password)
        }}, {upsert: true})
    }
    if (await db.categories.findOne({parentId: null}) === null) {
        logger.info('Root category is not found. Creating new one');
        const {insertedId: id} = await db.categories.insertOne(Category.fromDefault(m => {
            m.title = "/";
            m.category_type = 'general'
        }).toDb());
        logger.info('New root directory created (id=%s)', id);
    }
};

export const getDatabase = async () => {
    const db = await getDbClient();
    return new DB(db.db());
};

class DB {
    private db: Db;

    constructor(db: Db) {
        this.db = db;
    }

    get users() {
        return this.db.collection('users')
    }

    get categories() {
        return this.db.collection('categories')
    }

    get scripts() {
        return this.db.collection('scripts')
    }

    get chara_lists() {
        return this.db.collection('chara_lists')
    }
}

export const getId = (dbObject: any) => {
    const id = dbObject._id || dbObject.id;
    if (!id) {
        return undefined;
    }
    if (typeof id === 'string') {
        return id;
    }
    if (id.toHexString) {
        return id.toHexString();
    }
    return id.toString();
};