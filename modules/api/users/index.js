const usersRouter = require('express').Router();
const auth = global.auth;
const db = global.db;

const moment = require('moment');
const CryptoJS = require('crypto-js');

const FuzzySet = require('fuzzyset.js');

usersRouter.get('/', (req, res) => {
    res.status(200).json({message: 'Connected'}).end();
});

usersRouter.get('/search', (req, res) => {
    auth.orize(req, req).then((data) => {
        let query = db.sql.select().from('advdb.adv_tbl_users');
        return db.execute(query);
    }).then((users) => {
        let searchParams = {}
        Object.keys(req.query).filter((field) => {
            return (internal.allowedSearchFields.includes(field)) ? true : false;
        }).map((key) => {
            searchParams[key.toUpperCase()] = req.query[key];
        });
        var keys = Object.keys(searchParams);

        let filteredUsers = users.map((user) => {
            return internal.decrypt(user);
        }).filter((user) => {
            let matches = keys.filter((key) => {
                if (!internal.nonFuzzyFields.includes(key)) {
                    let check = FuzzySet();
                    check.add(user[key]);
                    let result = check.get(searchParams[key]);
                    return (result !== null) ? true : false;
                } else {
                    return (user[key] == searchParams[key]) ? true : false;
                }
            });

            return (matches.length == keys.length) ? true : false;
        });
        return Promise.resolve(filteredUsers);
    }).then((users) => {
        let searchResults = {};
        if (users.length == 0) {
            searchResults.noResults = true;
            searchResults.message = 'No users found based on your search input.';
            res.status(404).json(searchResults).end();
        } else {
            searchResults.noResults = false;
            searchResults.users = users;
            res.status(200).json(searchResults).end();
        }
    }).catch((error) => {
        global.errorHandler(req, res, error);
        console.log(req.method, req.url, error);
    });
});

usersRouter.post('/new', (req, res) => {
    let user = {};
    auth.orize(req, res).then((data) => {
        internal.fields.map((uKey) => {
            let lKey = uKey.toLowerCase();
            if (lKey in req.body && !String.isNullOrEmpty(req.body[lKey])) {
                user[uKey] = req.body[lKey].trim();
            }
        });

        let uid = user.FIRST_NAME.substring(0,2) + user.LAST_NAME.substring(0,2) + user.DOB.replace('-', '');
        user.USER_ID = CryptoJS.HmacSHA512(uid, moment(user.DOB, 'DD/MM/YYYY').format('x')).toString();
        user.ADDED_BY = data.uid;
        let query = db.sql.select().from('advdb.adv_tbl_users').where('USER_ID = ?', user.USER_ID).limit(1);
        return db.execute(query, 1);
    }).then((userFound) => {
        if (userFound) {
            let info = {}
            info.userFound = internal.decrypt(userFound);
            return Promise.reject(info);
        } else {
            return internal.encrypt(user);
        }
    }).then((encryptedUser) => {
        let query = {
            text: "INSERT INTO advdb.adv_tbl_users SET ?",
            values: encryptedUser,
        }
        return db.execute(query);
    }).then((insertedUser) => {
        if (insertedUser.affectedRows == 1 && 'insertId' in insertedUser) {
            res.status(200).json({message: 'Successfully created user!', user_id: user.USER_ID }).end();
        } else {
            res.status(500).json({message: 'A server error occured, please try again.'}).end();
        }
    }).catch((error) => {
        if (error.userFound) {
            res.status(409).json({message: 'It looks like this user might already exist!', user: error.userFound}).end();
        } else {
            global.errorHandler(req, res, error);
            console.log(req.method, req.url, error);
        }
    });
});

usersRouter.post('/update', (req, res) => {
    let user = {};
    let dbID = false;
    auth.orize(req, res).then((data) => {
        internal.fields.map((uKey) => {
            let lKey = uKey.toLowerCase();
            if (lKey in req.body && !String.isNullOrEmpty(req.body[lKey])) {
                user[uKey] = req.body[lKey].trim();
            }
        });

        let uid = user.FIRST_NAME.substring(0,2) + user.LAST_NAME.substring(0,2) + user.DOB.replace('-', '');
        user.USER_ID = CryptoJS.HmacSHA512(uid, moment(user.DOB, 'DD/MM/YYYY').format('x')).toString();
        user.ADDED_BY = data.uid;

        if (!('uid' in req.body)) {
            return Promise.reject({
                missingUid: true,
                message: 'A valid User ID is missing, please refresh and try again.',
            });
        } else {
            let query = db.sql.select().field('ID').from('advdb.adv_tbl_users').where('USER_ID = ?', req.body.uid).limit(1);
            if (user.USER_ID == req.body.uid) {
                return db.execute(query, 1);
            } else {
                let userCheck = db.sql.select().from('advdb.adv_tbl_users').where('USER_ID = ?', user.USER_ID).limit(1);
                return db.execute(userCheck, 1).then((userFound) => {
                    if (userFound) {
                        let info = {}
                        info.userFound = internal.decrypt(userFound);
                        return Promise.reject(info);
                    } else {
                        return db.execute(query, 1);
                    }
                });
            }
        }
    }).then((userID) => {
        dbID = userID.ID;
        return internal.encrypt(user);
    }).then((encryptedUser) => {
        let query = {
            text: "UPDATE advdb.adv_tbl_users SET ? WHERE ID = "+db.mysql.escape(dbID),
            values: encryptedUser,
        }
        return db.execute(query);
    }).then((updateResults) => {
        if ('changedRows' in updateResults && updateResults.changedRows == 1) {
            res.status(200).json({message: 'Successfully updated user!', user_id: user.USER_ID }).end();
        } else {
            res.status(500).json({message: 'A server error occured, please try again.'}).end();
        }
    }).catch((error) => {
        if (error.userFound) {
            res.status(409).json({message: 'It looks like this user might already exist!', user: error.userFound}).end();
        } else if (error.missingUid) {
            res.status(404).json({message: error.message}).end();
        } else {
            global.errorHandler(req, res, error);
            console.log(req.method, req.url, error);
        }
    });
});

var internal = {
    allowedSearchFields: ['first_name', 'last_name', 'email', 'gender', 'dob', 'ph_mobile', 'ph_home', 'ph_work', 'dnd'],
    fields: ['FIRST_NAME','LAST_NAME','DOB','GENDER','DEFENCE','EMAIL','PH_MOBILE','PH_HOME','PH_WORK','ADDR_L1','ADDR_TOWN','ADDR_STATE','ADDR_POST', 'DND'],
    privateFields: ['FIRST_NAME','LAST_NAME','EMAIL','PH_MOBILE','PH_HOME','PH_WORK','DOB','ADDR_L1','ADDR_TOWN','ADDR_STATE','ADDR_POST','DEFENCE'],
    nonFuzzyFields: ['DND'],
    encrypt: function(user) {
        internal.privateFields.map((key) => {
            if (key in user) {
                user[key] = auth.cryptography.encrypt(user[key]);
            }
        });
        return Promise.resolve(user);
    },
    decrypt: function(user) {
        internal.privateFields.map((key) => {
            if (key in user) {
                user[key] = auth.cryptography.decrypt(user[key]);
            }
        });
        return user;
    },
}

module.exports = usersRouter;
