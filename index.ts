/* eslint-disable @typescript-eslint/no-var-requires */
import socketIO from 'socket.io';
import path from 'path'
import http from 'http';

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

const server = http.createServer();
const io = new socketIO.Server(server, {
    cors: {
        origin: process.env.MAIN_HOST,
        methods: ["GET", "POST"],
        credentials: true
    }
});

require("./sockets")

server.listen(launchArgs.port, () => {
    console.log(`${chalk.magenta('event')} - Websocket server running in ${launchArgs.dev == true ? 'development' : 'production'} mode at ${launchArgs.port}`);
})

export { server, io }