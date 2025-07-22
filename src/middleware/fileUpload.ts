import multer from 'multer';
import fs from 'fs';
import { Config } from '../shared/common/config/config';
import { NextFunction, Request, Response } from 'express';
import { Logger } from '../shared/common/logger';
const fileUploadDest = Config.instance.config.fileUploadDest;

const logger = Logger.instance.getLogger();

if (!fs.existsSync(fileUploadDest)) {
	fs.mkdirSync(fileUploadDest);
}

const storage = multer.diskStorage({
	destination(req, file, cb) {
		const uploadDir = `${fileUploadDest}`;

		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir);
		}

		if (!file.mimetype.startsWith('image')) {
			return cb(new Error(`Invalid mimetype, expected "image" got "${file.mimetype}"`), uploadDir);
		}

		req.headers['X-uploadDir'] = uploadDir;
		cb(null, uploadDir);
	},
	filename(req, file, cb) {
		const extension = file.originalname.split('.');
		const fileName = encodeURI(`${new Date().toISOString()}-${crypto.randomUUID()}.${extension[extension.length - 1]}`);

		const encodedFileName = encodeURI(fileName);

		if (!file.mimetype.startsWith('image')) {
			return cb(new Error(`Invalid mimetype, expected "image" got "${file.mimetype}"`), encodedFileName);
		}

		if (!req.headers['X-uploadPaths']) {
			req.headers['X-uploadPaths'] = [];
		}
		(req.headers['X-uploadPaths'] as Array<string>).push(encodedFileName);
		cb(null, encodedFileName);
	},
});

const addUploadErrorProtection = (req: Request, res: Response, next: NextFunction) => {
	const uploadHandler = () => {
		try {
			logger.info('Client aborted upload');
			if (req.headers['X-uploadPaths'] && req.headers['X-uploadDir']) {
				const uploadDir = req.headers['X-uploadDir'];
				for (const filePath of req.headers['X-uploadPaths']) {
					fs.unlink(`${uploadDir}/${filePath}`, (error) => {
						if (error) {
							logger.error('Error while unlinking uploaded file!', { error, filePath })
						}
					});
				}
			}
		} catch (error) {
			logger.error(error);
		}
	};
	req.on('aborted', uploadHandler);
	//req.on('close', uploadHandler('close'));
	next();
}

export default multer({ storage });
export { addUploadErrorProtection };
