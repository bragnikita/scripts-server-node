import asyncHandler from 'express-async-handler';
import express, {NextFunction, Request, Response, Router} from "express";
import multiparty, {File} from "multiparty";
import * as path from "path";
import {promises as fsp} from "fs";
import fs from "fs";
import {aH} from "../util/misc";
import {UploadsService} from "../services";


const upload = new UploadsService(
    path.join(process.cwd(), process.env.UPLOADS_DIR || 'uploads/images'),
    path.join(process.cwd(), process.env.TMP_UPLOADS_DIR || 'tmp/uploads')
);
fs.mkdirSync(upload.tmpDir(), {recursive: true});

const router = Router();

/**
 * POST /uploads/:domain/:id?
 * uploads/replace image
 */

router.post('/:domain/:id?', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const domain = req.params['domain'];
    const id = req.params['id'] || upload.nextId(domain);

    const form = new multiparty.Form({autoFiles: true, uploadDir: upload.tmpDir()});

    const fileHandler = aH(async (error: Error, fields: any, files: any) => {
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
        console.log(fsp);
        await fsp.mkdir(uploadDir, {recursive: true});
        await upload.deleteFile(domain, id);
        await fsp.rename(file.path, newFileName);
        console.log(req.headers);
        res.status(201).json({
            path: `/images/${domain}/${fileName}`,
            url: `${req.protocol}://${req.header('host')}/images/${domain}/${fileName}`,
        });
    }, next);
    form.parse(req, fileHandler)
}));

/**
 * DELETE /uploads/:domain/:id
 * deletes image
 */
router.delete('/:domain/:id', asyncHandler(async (req: Request, resp: Response) => {
    const domain = req.params['domain'];
    const id = req.params['id'];
    await upload.deleteFile(domain, id);
    return resp.sendStatus(200);
}));

export const getStatic  = () => {
    return express.static(upload.uploadRoot);
};
export default router;
