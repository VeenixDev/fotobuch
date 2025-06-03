import multer from 'multer';
import fs from 'fs';
import { Config } from '../shared/common/config/config';
const fileUploadDest = Config.instance.config.fileUploadDest;

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

		cb(null, uploadDir);
	},
	filename(req, file, cb) {
		const extension = file.originalname.split('.');
		const fileName = encodeURI(`${new Date().toISOString()}-${crypto.randomUUID()}.${extension[extension.length - 1]}`);

		const encodedFileName = encodeURI(fileName);

		if (!file.mimetype.startsWith('image')) {
			return cb(new Error(`Invalid mimetype, expected "image" got "${file.mimetype}"`), encodedFileName);
		}

		cb(null, encodedFileName);
	},
});

export default multer({ storage });
