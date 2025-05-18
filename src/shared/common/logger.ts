import winston from 'winston';
import LokiTransport from 'winston-loki';
import { Config } from './config/config';

class Logger {
    private static _instance: Logger | null = null;
    private environmentWarningSent = false;

    private constructor() {}

    public getLogger(): winston.Logger {
        const transports: winston.transport[] = [
                new winston.transports.Console(),
            ];

        if (Config.instance.config.environment !== 'LOCAL') {
            new LokiTransport({
                host: `${Config.instance.config.loki.host}:${Config.instance.config.loki.port}`,
                json: true,
                labels: { service: 'fotobuch', project: 'fotobuch' },
                batching: false,
                timeout: 5000,
                onConnectionError(error: unknown) {
                    if (Config.instance.config.environment === 'LOCAL') {
                        console.warn('Could not connect to loki, logs will not be persisted! This will only work with ENVIRONMENT=LOCAL')
                    } else {
                        console.error('Could not connect to loki!', error);
                        process.exit(1);
                    }
                },
            })
        } else {
            if (!this.environmentWarningSent) {
                this.environmentWarningSent = true;

                console.warn('Environment is LOCAL thus no logs are sent to loki!');
            }
        }

        return winston.createLogger({
            transports,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            defaultMeta: {
                service: 'fotobuch',
                project: 'fotobuch',
            },
        });
    }

    public static get instance(): Logger {
        if (!this._instance) {
            this._instance = new Logger();
        }
        return this._instance;
    }
}

export { Logger };
