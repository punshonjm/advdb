const auth = require('./auth');
const Handlebars = require('handlebars');
const moment = require('moment');

const page = require('./page')(Handlebars);
const routes = require('express').Router();

routes.get('/', (req, res) => {
    auth.orize(req, res).then((data) => {
        return page.compile('home', data);
    }).then((html) => {
        res.send(html).end();
    }).catch((error) => errorHandler(req, req, error));
});

// Handle request for home page
routes.get('/', (req, res) => {
    auth.orize(req, res).then((data) => {
        return page.compile('home', data);
    }).then((html) => {
        res.send(html).end();
    }).catch((error) => errorHandler(req, req, error));
});

routes.get('/users', (req, res) => {
    auth.orize(req, res).then((data) => {
        return page.compile('users/main', data);
    }).then((html) => {
        res.send(html).end();
    }).catch((error) => errorHandler(req, req, error));
});

routes.get('/races', (req, res) => {
    auth.orize(req, res).then((data) => {
        return page.compile('races/main', data);
    }).then((html) => {
        res.send(html).end();
    }).catch((error) => errorHandler(req, req, error));
});

// Handle request for public key
routes.get('/key', (req, res) => {
    auth.publicKey().then((publicKey) => {
        res.json(publicKey).end();
    }).catch((error) => errorHandler(req, req, error));
});

// Handle login request
routes.post('/login', (req, res) => {
    let details = {
        username: req.body.username,
        password: req.body.password,
    }

    auth.enticate(details).then((user) => {
        let cookie = {
            token: user.token,
            expires: moment(user.expires).format('YYYY-MM-DD HH:mm:ss'),
        };
        res.status(200).cookie('advdb', cookie, {expires: moment(user.expires).toDate()}).end();
    }).catch((error) => errorHandler(req, req, error));
});

// Handle logout request
routes.get('/logout', (req, res) => {
    auth.user.logout(req, res).then((sendRefresh) => {
        if (sendRefresh) {
            res.status(200).end();
        } else {
            res.status(500).end();
        }
    }).catch((error) => errorHandler(req, req, error));
});

const api = require('./api');
routes.use('/api', api);

module.exports = routes;

let errorHandler = function(req, req, error) {
    if (error.authError) {
        res.status(401).json({
            message: error.message,
        }).end();
    } else if (error.notAuthorised) {
        res.status()
    } else {
        console.error(req.method, req.url, error);
    }
}