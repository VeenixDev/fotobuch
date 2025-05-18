import multer from 'multer';
import fs from 'fs';
import { Config } from '../shared/common/config/config';

const fileUploadDest = Config.instance.config.fileUploadDest;

if (!fs.existsSync(fileUploadDest)) {
	fs.mkdirSync(fileUploadDest);
}

const storage = multer.diskStorage({
	destination(req, file, cb) {
		const randomUUID = crypto.randomUUID();
		const uploadDir = `${fileUploadDest}/${randomUUID}`;

		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir);
		}
		cb(null, uploadDir);
	},
	filename(req, file, cb) {
		const fileName = `${new Date().toISOString()}-${file.originalname}`;
		cb(null, encodeURI(fileName));
	},
});

export default multer({ storage });
