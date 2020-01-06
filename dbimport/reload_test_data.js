import {MongoClient} from "mongodb";

const f = async (db) => {
    const coll = db.collection('categories');
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

MongoClient.connect(process.env.MONGODB_URL, {useNewUrlParser: true}).then(f);

export default f;