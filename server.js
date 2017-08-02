// Require system modules
const fs = require('fs');
const path = require('path');

// Require server modules & Express middleware
const express = require('express');
const http = require('http');
const https = require('https');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

// Require additional modules
const moment = require('moment');

// Create Express server
var server = express();

// Create global variables
global.config = require(`${__dirname}/config.json`);
global.auth = require(`${__dirname}/modules/auth`);
global.db = require(`${__dirname}/modules/db`);

// Static serve /.well-known to allow renewal of Let's Encrypt certificates
// server.use('/.well-known', express.static(path.join(__dirname, 'www/.well-known')));

// Middleware to parse various parts of requests
server.use(cookieParser());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({extended: true}));

// Reroute non-secure connections to https
// server.all('*', (req, res, next) => {
//     if (req.secure) {
//         return next();
//     } else {
//         res.redirect(`https://${req.hostname}${req.url}`);
//     }
// });

// Serve static public folder
server.use('/public', express.static(path.join(__dirname, 'www/public')));
// Middleware to Confirm Session
server.use(auth.check.Session);
// Serve static assets folder
server.use('/assets', express.static(path.join(__dirname, 'www/assets')));

const routes = require(`${__dirname}/modules/routes`);
server.use('/', routes);

// const pageRouting = require(`${__dirname}/modules/routes`)(server);

// const apiRouting = require(`${__dirname}/modules/api`);
// server.use('/api', apiRouting);

// let httpsServer = https.createServer({
//     key: fs.readFileSync(path.join(__dirname, 'ssl/private.pem')),
//     cert: fs.readFileSync(path.join(__dirname, 'ssl/certificate.pem')),
// }, server).listen(443, () => {
//     console.log(moment().format('YYYY-MM-DD h:mm a'), ":: AdventurethonDB Started");
// });
// let httpServer = http.createServer(server).listen(80, () => {
//     console.log(moment().format('YYYY-MM-DD h:mm a'), ":: AdventurethonDB Started");
// });

require('letsencrypt-express').create({
    server: 'staging',
    email: global.config.eml,
    agreeTos: true,
    approveDomains: [global.config.url],
    app: server,
}).listen(80, 443);
