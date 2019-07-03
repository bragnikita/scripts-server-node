import * as path from "path";
import * as fs from "fs"

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
        if (!(await fs.promises.stat(dir)).isDirectory()) {
            return;
        }
        const list = await fs.promises.readdir(dir);
        for (const f of list) {
            const name = path.basename(f);
            if (name.startsWith(id + "__")) {
                const fFullPath = path.join(dir, name);
                await fs.promises.unlink(fFullPath);
            }
        }
    };

}