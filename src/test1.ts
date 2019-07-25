import {CategoriesModel, Schema} from "./models/categories";
import {inspect} from "util";

(async() => {
    process.env.MONGODB_URL="mongodb://script_editor__api:initial_password@localhost:27018/script_editor";

    const {error, value} = Schema.validate({
        _id: "423435234",
        title: "title"
    })
    console.log(error)
    console.log(value)
})().then(() => {
    process.exit(0)
}).catch(() => {
    process.exit(1)
});
