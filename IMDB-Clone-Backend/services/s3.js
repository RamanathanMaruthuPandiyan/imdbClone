import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createRequire } from 'module';
import path from 'path';
import uuid from 'uuid-random';

const require = createRequire(import.meta.url);
const config = require(`../config/config.${process.env.NODE_ENV}.json`);
const awsS3Config = config.aws;

async function getS3Configuration() {
    try {
        return new S3Client({
            credentials: {
                accessKeyId: awsS3Config.accessKeyId,
                secretAccessKey: awsS3Config.accessKeySecret,
            },
            region: awsS3Config.region,
        });
    } catch (err) {
        throw new Error('Failed to get AWS configuration.');
    }
}

function generateFilePath(fileName, type) {
    return `${uuid()}-${new Date().toISOString()}${path.extname(fileName)}`;
}

async function uploadFileToS3(file, type) {
    try {
        const s3 = await getS3Configuration();

        // Generate the file path
        const filePath = generateFilePath(file.originalname, type);

        // Create the command to upload the file
        const command = new PutObjectCommand({
            Bucket: awsS3Config.bucketName,
            Key: filePath,
            Body: file.buffer,
            ContentType: file.mimetype, // Ensure the correct MIME type
        });

        // Upload the file
        await s3.send(command);

        // Construct the full URL using bucketUrl from your config
        const fileUrl = `${awsS3Config.bucketUrl}${filePath}`;

        return {
            message: 'File uploaded successfully',
            fileUrl: fileUrl
        };
    } catch (err) {
        throw new Error('Failed to upload file to S3: ' + err.message);
    }
}

async function deleteFileFromS3(file) {
    try {
        const s3 = await getS3Configuration();

        const command = new DeleteObjectCommand({
            Bucket: awsS3Config.bucketName,
            Key: file
        });

        await s3.send(command);

        return Promise.resolve("Successfully removed the upload.");
    } catch (err) {
        throw new Error('Failed to delete file from S3: ' + err.message);
    }
}


export default {
    uploadFileToS3,
    deleteFileFromS3
};
