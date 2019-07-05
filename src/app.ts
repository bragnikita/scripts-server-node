import express, {NextFunction, Request, Response} from "express"
import bodyParser from "body-parser";
import errorHandler from "errorhandler";

import cors from 'cors';
import logger from "./util/logger";
import {checkDatabase} from "./util/database";
import uploadRoutes, {getStatic} from "./controllers/upload";
import charaRoutes from "./controllers/chara_lists";
import {extractUserMiddleware, needAuthentication, providerMiddleware} from "./middleware/auth";
import User from "./models/user";
import {compose} from "compose-middleware";

if (!checkDatabase()) {
    logger.warn("Could not connect the database. Exit");
    process.exit(1);
} else {
    logger.info('Database connection established')
}

const authMiddleware = extractUserMiddleware(async (id: string) => {

   return null;
});
const mustAuthorized = compose([authMiddleware, providerMiddleware(async ()=> {
    const user = new User();
    user._id = "fsfsfsfsdf";
    user.username = "admin";
    return user;
}), needAuthentication()]);

const app = express();

app.use('/images', getStatic());
app.use((req: Request, res: Response, next: NextFunction) => {
    next();
    if (req.method.toUpperCase() !== 'OPTIONS') {
        logger.info('%s  %s - %d', req.method.toUpperCase(), req.path, res.statusCode);
    }
});
app.use(cors());
app.use(bodyParser.json());

app.get('/', function (req: Request, res: Response) {
    res.send('hello world!!!')
});
app.use('/uploads', mustAuthorized, uploadRoutes);
app.use('/chara_lists', charaRoutes);


app.use(errorHandler({
    log: (err, str, req, res) => {
        logger.error("%s  %s - %s", req.method.toUpperCase(), req.path, err.message || str, err)
    }
}));

app.listen(process.env.APP_PORT || 3000, () => {
});


