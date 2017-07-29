const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const moment = require('moment');

const server = express();
global.auth = require(`${__dirname}/modules/auth`);
global.db = require(`${__dirname}/modules/db`);

server.use(cookieParser());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({extended: true}));
server.use(auth.check.Session);

server.use('/public', express.static(path.join(__dirname, 'www/public')));
server.use('/assets', express.static(path.join(__dirname, 'www/assets')));

const routes = require(`${__dirname}/modules/routes`);
server.use('/', routes)
// const pageRouting = require(`${__dirname}/modules/routes`)(server);

// const apiRouting = require(`${__dirname}/modules/api`);
// server.use('/api', apiRouting);

server.listen(8080, () => {
    console.log(moment().format('YYYY-MM-DD h:mm a'), ":: AdventurethonDB Started");
});
