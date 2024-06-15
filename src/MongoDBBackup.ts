import { spawn } from "child_process";
import path from "path";
import fs from 'fs';

interface IMongoDBBackupOptions {
    username?: string;
    password?: string;
    database?: string;
    host?: string;
    port?: number;
    outputPath: string;
}

export default class MongoDBBackup {

    username?: string;
    password?: string;
    port?: number;
    database?: string;
    host?: string;
    output?: string;
    outputPath: string;

    constructor(options: IMongoDBBackupOptions) {
        this.username = options.username;
        this.password = options.password;
        this.database = options.database;
        this.host = options.host;
        this.port = options.port;
        this.outputPath = options.outputPath;
    }

    argsMaker() {
        let folder = path.resolve(this.outputPath ,'temp'); 
        let output = path.resolve(folder, `${new Date().valueOf()}-${this.database??'mongoDB'}.gz`);
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder,{ recursive: true });
        }

        this.output = output;
        let args: any[] = [
            '--host', this.host,
            '--port', this.port ?? 27017,
            '--db', this.database,
            `--archive=${output}`,
            '--gzip'
        ];
        if (this.username) {
            args = [...args, '--username', this.username];
        }
        if (this.password) {
            args = [...args, '--password', this.password];
        }

        return args;
    }

    async exec() {
        if (!this.host || !this.database) {
            return;
        }
        const child = spawn('mongodump', this.argsMaker());

        let data = "";
        for await (const chunk of child.stdout) {
            data += chunk;
        }
        let error = "";
        for await (const chunk of child.stderr) {
            error += chunk;
        }
        const exitCode = await new Promise((resolve, reject) => {
            child.on('close', resolve);
        });

        if (exitCode) {
            throw new Error(`mongoDB backup error: ${exitCode}, ${error}`);
        }

        return this.output;
    }
}