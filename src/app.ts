import express, {NextFunction, Request, Response} from "express"
import bodyParser from "body-parser";
import multiparty, {File} from "multiparty";
import * as fs from "fs";
import * as path from "path";
import errorHandler from "errorhandler";
import {UploadsService} from "./services";
import asyncHandler from 'express-async-handler';
import cors from 'cors';


const app = express();

app.use(bodyParser.json());
app.use(cors());
// respond with "hello world" when a GET request is made to the homepage
app.get('/', function (req: Request, res: Response) {
    res.send('hello world!!!')
});


const upload = new UploadsService(path.join(process.cwd(), 'data/images'), path.join(process.cwd(), 'tmp/uploads') );
fs.mkdirSync(upload.tmpDir(), {recursive: true});

const aH = (fn: any, next: NextFunction) => {
    return async (...args:any) => {
        try {
            return await fn(...args)
        } catch (e) {
            next(e)
        }
    }
};

/**
 * POST /uploads/:domain/:id
 * uploads/replace image
*/
app.post('/uploads/:domain/:id', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const domain = req.params['domain'];
    const id = req.params['id'];

    const form = new multiparty.Form({autoFiles: true, uploadDir: upload.tmpDir()});

    const fileHandler = aH(async (error:Error, fields:any, files:any) => {
        if (error) {
            return res.status(500).send(error.message);
        }
        const fileColl: File[] = files['file'];
        if (!fileColl || fileColl.length == 0) {
            return res.status(400).send('[file] not found');
        }
        const file = fileColl[0];
        const newFileName = upload.buildPath(domain, id, file.originalFilename);
        const fileName = path.basename(newFileName);
        const uploadDir = path.dirname(newFileName);
        await fs.promises.mkdir(uploadDir, {recursive: true});
        await upload.deleteFile(domain, id);
        await fs.promises.rename(file.path, newFileName);
        return res.status(200).json({
            url: `/images/${domain}/${fileName}`,
        });
    }, next);
    form.parse(req, fileHandler)
}));

/**
 * DELETE /uploads/:domain/:id
 * deletes image
 */
app.delete('/uploads/:domain/:id', asyncHandler(async (req: Request, resp: Response) => {
    const domain = req.params['domain'];
    const id = req.params['id'];
    await upload.deleteFile(domain, id);
    return resp.sendStatus(200);
}));

console.log(path.join(process.cwd(), 'data/images'));

// serves images from the upload root
app.use('/images', express.static(upload.uploadRoot));

app.use(errorHandler());
app.listen(3000);


