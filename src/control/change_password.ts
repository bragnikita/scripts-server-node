import {getDatabase} from "../util/database";
import User from "../models/user";
import {EnvConfigurer} from "../util/env_configurer";

const change_password = async (username: string, password: string) => {
    const db = await getDatabase();
    const user = await db.users.findOne({username: username});
    if (!user) {
        throw `User ${username} was not found`;
    }
    const newPasswordHash = await User.hashed_password(password);
    await db.users.updateOne({_id: user._id},
        {$set: {password_hash: newPasswordHash}});
    return "Updated!"
};

new EnvConfigurer().configure('./.env.production');
change_password(process.argv[2], process.argv[3])
    .then((s) => {
        console.log(s);
        process.exit(0)
    })
    .catch((e) => {
        console.log(e)
        process.exit(1)
    });