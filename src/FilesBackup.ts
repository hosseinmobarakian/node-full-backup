import fs from "fs";
import archiver from 'archiver';
import path from 'path';


interface IFilesBackupOptions {
    files?: string[],
    folders?: string[],
    outputPath: string,
    outputType?: 'zip' | 'tar',

}

export default class FilesBackup {
    files?: string[];
    folders?: string[];
    outputPath: string;
    output?: string;
    outputType: 'zip' | 'tar';

    constructor(options: IFilesBackupOptions) {
        this.files = options.files;
        this.folders = options.folders;
        this.outputPath = options.outputPath;
        this.outputType = options.outputType ?? 'zip';
    }

    async exec() {
        let folder = path.resolve(this.outputPath, 'temp');
        this.output = path.resolve(this.outputPath, 'temp', ('files_backup.' + this.outputType));
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
        const output = fs.createWriteStream(this.output);
        const archive = archiver(this.outputType, {
            zlib: { level: 9 }
        });

        archive.on('error', function (err) {
            throw err;
        });

        archive.pipe(output);

        for (const file of (this.files ?? [])) {
            archive.append(fs.createReadStream(path.resolve(file)), { name: path.basename(file) });
        }

        for (const folder of (this.folders ?? [])) {
            archive.directory(folder, path.basename(folder));
        }

        await archive.finalize();

        return this.output;
    }
}