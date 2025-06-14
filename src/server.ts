import { Config } from './shared/common/config/config';
// Has to load config before starting anything
Config.instance.init();

import { Logger } from './shared/common/logger';
import http from 'http';
import app from './app';

const logger = Logger.instance.getLogger();

(async () => {
    const SERVER_PORT: number = Number(Config.instance.config.port ?? '8080');

    const appServer = http.createServer(await app());

    appServer.listen(SERVER_PORT, () => {
        logger.info(`App server is running.`);
    });
})();

process.addListener('SIGINT', () => {
    logger.info('App server is stopping.');
});
