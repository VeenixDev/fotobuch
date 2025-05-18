import { NextFunction, Request, Response } from 'express';
import { Logger } from '../shared/common/logger';

const logger = Logger.instance.getLogger();

export const logRequest = (req: Request, _: Response, next: NextFunction) => {
	logger.info(`Got request for ${req.method} ${req.path}`, { body: req.body});
	next();
};
