import './config'
import {MongoClient} from "mongodb";
import logger from "./logger";

let db: MongoClient = undefined;

export const getDatabase = async () => {
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
    return getDatabase().then((database) => {
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