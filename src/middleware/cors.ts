import { NextFunction, Request, Response } from 'express';
import { Config } from '../shared/common/config/config';
import {Logger} from "../shared/common/logger";

const logger = Logger.instance.getLogger();

const cors = (req: Request, res: Response, next: NextFunction) => {
	const host = Config.instance.config.host;

	const remoteHost = (req.hostname ?? req.headers.origin ?? req.headers.referer)?.replace(
		/\/$/,
		''
	);

	if (
		(remoteHost !== undefined &&
		host === remoteHost)
	) {
		res.setHeader('Access-Control-Allow-Origin', remoteHost);
		req.headers['X-Domain'] = getDomain(remoteHost);
		req.headers['X-Host'] = remoteHost;
	} else {
		logger.warn(`Unknown remote host '${remoteHost}'`, { host, domain: remoteHost === undefined ? undefined : getDomain(remoteHost) });
		res.end();
		return;
	}

	res.setHeader(
		'Access-Control-Allow-Headers',
		'Content-Type, Accept, Origin, X-Requested-With'
	);
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	res.setHeader(
		'Access-Control-Allow-Methods',
		'GET, POST, PUT, PATCH, DELETE, OPTIONS'
	);

	if ('OPTIONS' === req.method) {
		res.sendStatus(200);
	} else {
		next();
	}
};

function getDomain(origin: string): string {
	return origin.split('://')[1]?.split('/')[0];
}

export { cors };
