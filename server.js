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

// Middleware to parse various parts of requests
server.use(cookieParser());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({extended: true}));

// Serve static public folder
server.use('/public', express.static(path.join(__dirname, 'www/public')));
// Middleware to Confirm Session
server.use(auth.check.Session);
// Serve static assets folder
server.use('/assets', express.static(path.join(__dirname, 'www/assets')));

// Import routing and assugb ti default route
const routes = require(`${__dirname}/modules/routes`);
server.use('/', routes);

require('letsencrypt-express').create({
    server: 'https://acme-v01.api.letsencrypt.org/directory',
    email: global.config.eml,
    agreeTos: true,
    approveDomains: [global.config.url],
    app: server,
    debug: false,
}).listen(80, 443);
