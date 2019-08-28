import bcrypt from 'bcrypt';
import {Config} from "../util/config";
import {plainToClassFromExist} from "class-transformer";

export type UserModel = {
    username: string,
    password_hash: string,
}

export default class User {
    id: string;
    readonly attrs: UserModel = {
        username: "",
        password_hash: "",
    };
    get username() { return this.attrs.username }
    get password_hash() { return this.attrs.password_hash }

    constructor(name?: string) {
        if (name) {
            this.attrs.username = name;
        }
    }

    static fromDb = (json: any) => {
      const u = new User();
      u.id = json._id ? json._id.toHexString() : json.id;
      plainToClassFromExist(u.attrs, json);
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