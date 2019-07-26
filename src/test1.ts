import {CategoriesModel, Schema} from "./models/categories";
import {inspect} from "util";
import {ValidationError} from "@hapi/joi";
import {ServiceContext} from "./models/utils";
import User from "./models/user";

(async() => {
    process.env.MONGODB_URL="mongodb://script_editor__api:initial_password@localhost:27018/script_editor";

    const cats = new CategoriesModel(new ServiceContext(new User("anon")));
    const {error} = Schema.validate({
        titled: ""
    });
    console.log(error)
    console.log(error.constructor.name );
    console.log(error.name === "ValidationError")
})().then(() => {
    process.exit(0)
}).catch(() => {
    process.exit(1)
});
