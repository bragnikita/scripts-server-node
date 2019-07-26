import './config'
import {Db, MongoClient} from "mongodb";
import logger from "./logger";
import User from "../models/user";
import {CategoriesModel} from "../models/categories";

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

const connect = () => MongoClient.connect(process.env.MONGODB_URL,{ useNewUrlParser: true });

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

export const validateDatabase = async () => {
    const db = await getDatabase();
    const name = process.env.DEFAULT_USER_NAME;
    if (process.env.DEFAULT_USER_NAME) {
        const admin = await db.users.findOne({username: name});
        if (!admin) {
            logger.info('Default user %s not found, temporary user with password "changeme" will be created', name);
            await db.users.insertOne({
                username: name,
                password_hash: await User.hashed_password('changeme')
            })
        }
    }
    const cats = new CategoriesModel();
    if (await db.categories.findOne({parentId: null}) === null) {
        logger.info('Root category is not found. Creating new one');
        const { insertedId: id } = await db.categories.insertOne({
            title: '/'
        });
        logger.info('New root directory created (id=%s)', id);
    }
};

export const getDatabase = async () => {
    const db = await getDbClient();
    return new DB(db.db());
};

class DB {
    private db:Db;
    constructor(db:Db) {
        this.db = db;
    }

    get users() { return this.db.collection('users')}
    get categories() { return this.db.collection('categories')}
    get scripts() { return this.db.collection('scripts')}
    get chara_lists() { return this.db.collection('chara_lists')}
}