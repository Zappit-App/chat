import socketIO from 'socket.io';
import minimist from 'minimist';
import path from 'path'
import http from 'http';

require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const launchArgs = minimist(process.argv.slice(2), {
    string: ['port'],
    boolean: ['dev'],

    default: {
        dev: true,
        port: 8080,
    },
});

const server = http.createServer();
const io = new socketIO.Server(server);

server.listen(launchArgs.port, () => {
    console.log("Server running")
})