import {MongoClient} from "mongodb";

const f = async (db: MongoClient) => {
    const coll = db.db().collection('categories');
    await coll.deleteMany({});

    const rootCategory = {
        title: '/',
    };
    const {insertedId: root_id} = await coll.insertOne(rootCategory);
    const categories = [
        {title: 'cat_1', parentId: root_id},
        {title: 'cat_2', parentId: root_id},
    ];
    await coll.insertMany(categories);
};

MongoClient.connect(process.env.MONGODB_URL, {useNewUrlParser: true}).then((db) => {
    return f(db)
}).finally(() => {
    process.exit(0)
});

export default f;