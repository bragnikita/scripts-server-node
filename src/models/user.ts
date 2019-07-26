import bcrypt from 'bcrypt';
import {Config} from "../util/config";

export default class User {
    _id: string;
    username: string;
    password_hash: string;

    constructor(name: string) {
        this.username = name;
    }

    get id() {
        return this._id;
    }

    static fromDb = (json: any) => {
      const u = new User(json.username);
      u._id = json._id ? json._id.toHexString() : json.id;
      u.password_hash = json.password_hash;
      return u;
    };

    compare_passwords = async (pwd: string) => {
        return await User.compare_passwords(this.password_hash, pwd);
    };

    static hashed_password = async (pwd: string) => {
        return await bcrypt.hash(pwd, Config().saltRounds);
    };

    static compare_passwords = async (hash: string, password: string) => {
        return await bcrypt.compare(password, hash)
    }
}