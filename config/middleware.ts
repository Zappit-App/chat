import bodyParser from 'body-parser';
import compression from 'compression';
import chalk from 'chalk';
import cors from 'cors';

import { app } from '../index';

try {
    app.disable('x-powered-by');
    app.set('trust proxy', 1);

    app.use(
        bodyParser.urlencoded({
            extended: true,
        })
    );
    app.use(bodyParser.json());

    app.use(compression());
    app.use(cors({
        origin: process.env.MAIN_HOST,
        methods: ["GET", "POST"],
        credentials: true
    }))
} catch (err) {
    console.log(`${chalk.redBright('error')} - There was an error loading the middleware`);
    console.log(err);
}