import { createReadStream } from 'fs';
import path from 'path';
import { google } from 'googleapis';


async function authorize(keyFilePath: string) {
    const auth = new google.auth.GoogleAuth({
        keyFile: keyFilePath,
        scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive']
    })

    return auth;
}

async function uploadFile(jwtClient: any, filePath: string, googleFolderId: string) {
    const drive = google.drive({ version: 'v3', auth: jwtClient });

    const file = await drive.files.create({
        media: {
            body: createReadStream(filePath)
        },
        fields: 'id',
        requestBody: {
            name: path.basename(filePath),
            parents: [googleFolderId]
        },
    });

    return file;
}

export async function uploadToGoogleDrive(keyFilePath: string, filePath: string, googleFolderId: string) {
    const jwt = await authorize(keyFilePath);
    const file = await uploadFile(jwt, filePath, googleFolderId);

    return file;
}