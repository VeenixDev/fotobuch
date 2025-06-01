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
		cb(null, uploadDir);
	},
	filename(req, file, cb) {
		const extension = file.originalname.split('.');
		const fileName = encodeURI(`${new Date().toISOString()}-${crypto.randomUUID()}.${extension[extension.length - 1]}`);
		cb(null, encodeURI(fileName));
	},
});

export default multer({ storage });
