import * as path from "path";
import {promises as fsp} from "fs";
import {randomValueHex} from "./util/generators";

export class UploadsService {

    readonly uploadRoot: string;
    readonly uploadTempDir: string;

    constructor(uploadRoot: string, uploadTempDir: string) {
        this.uploadRoot = uploadRoot;
        this.uploadTempDir = uploadTempDir;
}

    uploadDir = (domain: string, id: string) => {
      return path.join(this.uploadRoot, domain);
    };

    tmpDir = () => {
        return this.uploadTempDir;
    };

    buildPath = (domain: string, id: string, origName: string) => {
        return path.join(this.uploadDir(domain, id), `${id}__${origName}`);
    };

    deleteFile = async (domain: string, id: string) => {
        const dir = this.uploadDir(domain, id);
        if (!(await fsp.stat(dir)).isDirectory()) {
            return;
        }
        const list = await fsp.readdir(dir);
        for (const f of list) {
            const name = path.basename(f);
            if (name.startsWith(id + "__")) {
                const fFullPath = path.join(dir, name);
                await fsp.unlink(fFullPath);
            }
        }
    };

    nextId = (domain: string) => {
        return 'XX_' + randomValueHex(8);
    }

}