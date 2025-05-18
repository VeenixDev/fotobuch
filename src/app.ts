import express from 'express';

import { logRequest } from './middleware/logRequest';
import { cors } from './middleware/cors';

import promBundle from 'express-prom-bundle';
import defaultController from "./controller/defaultController";

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
    app.use(logRequest);
    app.use(express.json());
    //app.use(cors);
    app.use('/', defaultController);

    return app;
}