import express from 'express';
import path from 'path';

import { cors } from './middleware/cors';

import promBundle from 'express-prom-bundle';
import defaultController from "./controller/defaultController";
import {Config} from "./shared/common/config/config";
import {logRequest} from "./middleware/logRequest";

export default async function (): Promise<express.Express> {
    const app = express();

    app.use(
        promBundle({
            includeMethod: true,
            includePath: true,
            includeStatusCode: true,
            includeUp: true,
            customLabels: {
                project_name: 'fotobuch',
                service: 'fotobuch',
            },
            promClient: {
                collectDefaultMetrics: {},
            },
        })
    );

    if (Config.instance.config.environment !== 'LOCAL') {
        app.use(cors);
    }

    // Serve frontend static files
    app.use(express.static(path.join(__dirname, Config.instance.config.frontendPath)));

		app.use(logRequest);
		app.use(express.json());

    // API routes
    app.use('/api', defaultController);

    // Serve index.html for all other routes
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, `${Config.instance.config.frontendPath}/index.html`));
    });

    return app;
}
