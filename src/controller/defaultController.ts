import express, {Request, Response} from "express";
import fs from 'node:fs';
import {Config} from "../shared/common/config/config";
import {Logger} from "../shared/common/logger";
import fileUpload from "../middleware/fileUpload";

const router = express.Router();
const uploadDir = Config.instance.config.fileUploadDest;
const logger = Logger.instance.getLogger();

router.get('/', async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const fileNameResult = await getAllFileNames(page, limit);

    if (fileNameResult instanceof Error) {
        res.sendStatus(500);
        return;
    }

    res.status(200).json(fileNameResult);
});

router.get('/:imageName', async (req: Request, res: Response) => {
    const imageName = req.params.imageName;
    if (!fs.existsSync(`${uploadDir}/${imageName}`)) {
        res.sendStatus(404);
        return;
    }

    res.sendFile(imageName, { root: uploadDir });
})

router.post('/upload', fileUpload.array('images'), async (req: Request, res: Response) => {
    try {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            res.status(400).json({ error: 'No files uploaded' });
            return;
        }

        const files = req.files as Express.Multer.File[];

        // Return information about the uploaded files
        res.status(201).json({
            message: `${files.length} file(s) uploaded successfully`,
            files: files.map(file => ({
                filename: file.filename,
                path: file.path
            }))
        });
        return;
    } catch (error) {
        logger.error('Error uploading files:', error);
        res.status(500).json({ error: 'Failed to upload files' });
        return;
    }
})

interface PaginatedResult {
    data: string[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

async function getAllFileNames(page: number = 1, limit: number = 10): Promise<PaginatedResult | Error> {
    try {
        const allFiles = fs.readdirSync(uploadDir).sort();
        const total = allFiles.length;
        const totalPages = Math.ceil(total / limit);

        // Ensure page is within valid range
        const validPage = Math.max(1, Math.min(page, totalPages || 1));

        // Calculate start and end indices for pagination
        const startIndex = (validPage - 1) * limit;
        const endIndex = Math.min(startIndex + limit, total);

        // Get the paginated subset of files
        const paginatedFiles = allFiles.slice(startIndex, endIndex);

        return {
            data: paginatedFiles,
            pagination: {
                total,
                page: validPage,
                limit,
                totalPages
            }
        };
    } catch (error) {
        if (error instanceof Error) {
            return error;
        }
        logger.error(error);
        throw error;
    }
}

export default router;
