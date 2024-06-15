import FilesBackup from "./FilesBackup";
import { DateTime } from 'luxon';
import MongoDBBackup from "./MongoDBBackup";
import path from "path";
import fs from 'fs';
import archiver from "archiver";
import corn from 'node-cron';
import { uploadToGoogleDrive } from './GoogleDrive';

export const TIME_FORMAT = "yyyy-MM-dd_HH-mm";
export type expireDaysType = '1d' | '2d' | '3d' | '4d' | '5d' | '10d' | '15d' | '20d' | '25d' | '30d' | '40d' | '50d' | '60d';
export const uploader = {
    googleDrive: uploadToGoogleDrive,
};


interface IFullBackupOptions {
    outputPath: string;
    outputNamePrefix?: string;
    cornExpression?: string;
    outputType?: 'zip' | 'tar';
    files?: string[];
    folders?: string[];
    expireDays?: expireDaysType;
    database?: {
        username?: string;
        password?: string;
        database: string;
        host: string;
        port?: number;
    },
    afterBackup?: (filePath: string) => void;
}

export default class FullBackup {
    outputPath: string;
    outputNamePrefix: string;
    outputType: 'zip' | 'tar';
    files?: string[];
    folders?: string[];
    cornExpression?: string;
    expireDays?: expireDaysType;
    database?: {
        username?: string;
        password?: string;
        database: string;
        host: string;
        port?: number;
    }

    cornTask?: corn.ScheduledTask;
    afterBackup?: (filePath: string) => void;

    constructor(options: IFullBackupOptions) {
        this.outputPath = options.outputPath;
        this.outputType = options.outputType ?? 'zip';
        this.outputNamePrefix = options.outputNamePrefix ?? 'backup';
        this.files = options.files;
        this.folders = options.folders;
        this.expireDays = options.expireDays;
        this.database = options.database;
        this.cornExpression = options.cornExpression;
        this.afterBackup = options.afterBackup;

        for (const folder of (options?.folders ?? [])) {
            if (path.resolve(folder) == path.resolve(this.outputPath)) {
                throw new Error('Your outputPath should not be inside backup folders!')
            }
        }
    }

    async deleteOldBackups() {
        if (!this.expireDays) {
            return;
        }

        const days = Number(this.expireDays.replace('d', ''));

        const fileList = fs.readdirSync(path.resolve(this.outputPath));


        for (const file of fileList) {
            const difference = DateTime.fromFormat(file.replace('backup', '').replace('.zip', '').replace('.tar', ''), TIME_FORMAT)?.diffNow(['days'])?.toObject()?.days ?? 0;

            if (Math.abs(difference) >= days) {
                fs.rm(path.resolve(this.outputPath, file), err => { });
            }
        }
    }

    async finishilize() {
        let folder = path.resolve(this.outputPath, 'temp');
        const output = path.resolve(this.outputPath, ((this.outputNamePrefix ?? 'backup') + '-' + DateTime.now().toFormat(TIME_FORMAT) + '.' + this.outputType));
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
        const outputFile = fs.createWriteStream(output);
        const archive = archiver(this.outputType, {
            zlib: { level: 9 }
        });

        archive.on('error', function (err) {
            throw err;
        });

        archive.pipe(outputFile);
        archive.directory(folder, false);

        await archive.finalize();

        fs.rmSync(folder, { recursive: true, force: true });

        return output;
    }

    async exec() {
        const filesBackup = new FilesBackup({
            files: this.files,
            folders: this.folders,
            outputPath: this.outputPath,
            outputType: this.outputType,
        });

        const mongoDBBackup = new MongoDBBackup({
            username: this.database?.username,
            password: this.database?.password,
            database: this.database?.database,
            host: this.database?.host,
            port: this.database?.port,
            outputPath: this.outputPath,
        });

        await filesBackup.exec();
        await mongoDBBackup.exec();

        const outputFile = await this.finishilize();
        this.afterBackup?.(outputFile);
        this.deleteOldBackups();
    }

    async start() {
        if (!this.cornExpression) {
            this.exec();
            return;
        }

        if (!corn.validate(this.cornExpression)) {
            throw new Error(this.cornExpression + ' - Corn Expression Is Invalid!');
        }

        if (!this.cornTask) {
            this.cornTask = corn.schedule(this.cornExpression, (now) => {
                this.exec();
            });
        }
    }
}

