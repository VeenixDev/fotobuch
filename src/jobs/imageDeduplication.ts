import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { Config } from '../shared/common/config/config';
import { Logger } from '../shared/common/logger';

const uploadDir = Config.instance.config.fileUploadDest;
const logger = Logger.instance.getLogger();

function formatBytes(bytes: number, locale = navigator.language || 'en-US') {
	if (bytes === 0) {
		return '0 Bytes';
	}

	const units = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte', 'petabyte'];
	const i = Math.floor(Math.log(bytes) / Math.log(1024)); // Use 1024 for binary units (KiB, MiB, etc.)

	// For simplicity, we'll try to use the 'unit' style.
	// If 'unit' style is not fully supported or we want more control,
	// we can fallback to a manual string construction.
	try {
		const formatter = new Intl.NumberFormat(locale, {
			style: 'unit',
			unit: units[i],
			unitDisplay: 'long', // 'short' (kB), 'narrow' (kB), 'long' (kilobyte)
			maximumFractionDigits: 2, // Adjust precision as needed
			minimumFractionDigits: 0,
		});
		return formatter.format(bytes / Math.pow(1024, i));
	} catch (e) {
		// Fallback for environments that might not fully support 'unit' style for all units
		// or if you prefer the traditional "KB", "MB" abbreviations.
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
		const num = (bytes / Math.pow(1024, i)).toFixed(2);
		return `${parseFloat(num)} ${sizes[i]}`;
	}
}

const imageDeduplication = async () => {
	if (!fs.existsSync(uploadDir)) {
		return;
	}
	logger.info('Start deduplication of uploads.');

	const imageHashSet = new Set();
	const directory = fs.opendirSync(uploadDir);
	let duplicateCount = 0;
	let totalFileCount = 0;
	let totalFileSize = 0;
	let totalRemovedSize = 0;

	for await (const dirent of directory) {
		if (dirent.isFile()) {
			const filePath = `${dirent.parentPath}/${dirent.name}`;
			const file = fs.readFileSync(filePath);

			if (file.length <= 0) {
				continue;
			}

			const fileSize = fs.statSync(filePath).size;
			totalFileSize += fileSize;

			totalFileCount++;
			const fileString = file.toString('utf-8', 0, file.length);
			const fileHash = createHash('sha1').update(fileString).digest('hex');

			if (imageHashSet.has(fileHash)) {
				fs.rmSync(filePath, { maxRetries: 3 });
				duplicateCount++;
				totalRemovedSize += fileSize;
			} else {
				imageHashSet.add(fileHash);
			}
		}
	}
	logger.info('Successfully completed image deduplication.', { duplicateCount, totalFileCount, directorySize: { before: formatBytes(totalFileSize), after: formatBytes(totalFileSize - totalRemovedSize) } });
}

export { imageDeduplication}