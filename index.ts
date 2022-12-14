/* eslint-disable @typescript-eslint/no-var-requires */
import socketIO from 'socket.io';
import path from 'path'
import http from 'http';
// import https from 'https';
import express from 'express';
// import fs from 'fs';

import minimist from 'minimist';
import chalk from 'chalk';

require('dotenv').config({ path: path.join(__dirname, './.env.local') });
const launchArgs = minimist(process.argv.slice(2), {
    string: ['port'],
    boolean: ['dev'],

    default: {
        dev: true,
        port: 3030,
    },
});

// const credentials = {
//     key: fs.readFileSync(path.join(__dirname, "./ssl/domain.key")),
//     cert: fs.readFileSync(path.join(__dirname, "./ssl/domain.crt")),
// }

const app = express()
// const server = http.createServer(credentials, app);
const server = http.createServer(app);
const io = new socketIO.Server(server, {
    cors: {
        origin: process.env.MAIN_HOST,
        methods: ["GET", "POST"],
        credentials: true
    }
});

require('./config/middleware');
require('./config/databases');
require('./config/routes');
require("./config/sockets")

server.listen(launchArgs.port, () => {
    console.log(`${chalk.magenta('event')} - Chat server running in ${launchArgs.dev == true ? 'development' : 'production'} mode at ${launchArgs.port}`);
})

export { server, io, app }