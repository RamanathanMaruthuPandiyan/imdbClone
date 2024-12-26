import { Router } from 'express';
import multer from 'multer';
import s3Services from '../services/s3.js';
import appLogger from '../logging/appLogger.js';

const router = Router();
const upload = multer(); // Use multer for parsing form-data

// Upload file directly to S3
router.post('/upload', upload.single('file'), async function (req, res) {
    try {
        const file = req.file; // Multer provides the uploaded file
        const type = req.body.type || "image"; // Additional metadata if required

        if (!file || !type) {
            throw new Error('File and type are mandatory fields.');
        }

        const result = await s3Services.uploadFileToS3(file, type);
        res.status(200).json(result);
    } catch (err) {
        appLogger.error('Error while uploading file to S3', err);
        res.status(500).send({ name: err.name, message: err.message });
    }
});


router.delete('/delete', async function (req, res) {
    try {
        const file = req.body.file;

        if (!file) {
            throw new Error('File url are mandatory fields.');
        }

        const result = await s3Services.deleteFileFromS3(file);
        res.status(200).json(result);
    } catch (err) {
        appLogger.error('Error while deleting file from S3', err);
        res.status(500).send({ name: err.name, message: err.message });
    }
});
export default router;
