/* eslint-disable @typescript-eslint/no-var-requires */
import chalk from 'chalk';
import { app } from '../';

try {
    app.use('/api/messages', require('../api/messages'));

    console.log(`${chalk.magenta('event')} - Routes loaded`);
} catch (err: unknown) {
    console.log(`${chalk.redBright('error ')} - There was an error loading the routes`);
    console.log(err);
}
