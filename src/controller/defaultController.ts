import express, {Request, Response} from "express";
import fs from 'node:fs';
import {Config} from "../shared/common/config/config";
import {Logger} from "../shared/common/logger";

const router = express.Router();
const uploadDir = Config.instance.config.fileUploadDest;
const logger = Logger.instance.getLogger();

router.get('/', async (req: Request, res: Response) => {
    const fileNameResult = await getAllFileNames();

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

async function getAllFileNames(): Promise<string[] | Error> {
    try {
        return fs.readdirSync(uploadDir);
    } catch (error) {
        if (error instanceof Error) {
            return error;
        }
        logger.error(error);
        throw error;
    }
}

export default router;