'use strict'
require('babel-polyfill');

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const moment = require('moment');
const sql = require('squel');
const CryptoJS = require('crypto-js');
const nodeRSA = require('node-rsa');

const db = require('./db.js');

var auth = {
    rsa: null,
    publicKey: function() {
        return Promise.resolve().then((next) => {
            if (auth.rsa == null) {
                auth.rsa = new nodeRSA({b: 512}, {encryptionScheme: 'pkcs1'});
            }
            return Promise.resolve({key: auth.rsa.exportKey('public')});
        });
    },
    user: {
        logout: function(req, res) {
            if (!String.isNullOrEmpty(req.cookies.advdb.token)) {
                let query = sql.delete().from('advdb._sessions').where('TOKEN = ?', req.cookies.advdb.token).limit(1);
                return db.execute(query).then((deleteStatus) => {
                    res.clearCookie('advdb');
                    return Promise.resolve({sendRefresh: true});
                });
            } else {
                res.clearCookie('advdb');
                return Promise.resolve({sendRefresh: true});
            }
        },
    },
    cryptography: {
        encrypt: function(value) {
            let iv = crypto.randomBytes(internal.config.saltBytes);
            let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(internal.config.hex, 'hex'), iv);
            let encrypted = cipher.update(value);
            return Buffer.concat([encrypted, cipher.final(), iv])
        },
        decrypt: function(buffer) {
            if (buffer == null) {
                return null;
            } else {
                let encryptedLength = buffer.length - internal.config.saltBytes;
                let iv = buffer.slice(encryptedLength);
                let encryptedText = buffer.slice(0, encryptedLength);

                let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(internal.config.hex, 'hex'), iv);
                let decrypted = decipher.update(encryptedText);
                decrypted = Buffer.concat([decrypted, decipher.final()]);

                return decrypted.toString();
            }
        },
    },
    check: {
        Cookie: function(req, res) {
            return Promise.resolve().then((next) => {
                if ('cookies' in req && 'advdb' in req.cookies) {
                    return Promise.resolve(req.cookies.advdb);
                } else {
                    return Promise.reject({
                        noCookie: true,
                        reason: 'Not Received/Set',
                    });
                }
            }).then((cookie) => {
                if (moment().isAfter(moment(cookie.expires, 'YYYY-MM-DD HH:mm:ss'))) {
                    res.clearCookie('advdb');
                    return Promise.reject({
                        noCookie: true,
                        reason: 'Expired',
                    });
                } else {
                    let query = sql.select()
                        .field('u.UID').field('u.USERNAME')
                        .from('advdb._sessions', 's').left_join('advdb._users', 'u', 's.UID = u.UID')
                        .where('TOKEN = ?', cookie.token).where('CREATED > DATE_SUB(CURRENT_DATE, INTERVAL 14 DAY)')
                        .order('CREATED', false).limit(1);
                    return db.execute(query, 1);
                }
            });
        },
        Session: function(req, res, next) {
            let authRequired = true;
            let noAuthPaths = ['/login', '/public', '/key',];

            noAuthPaths.map((path) => {
                let rx = new RegExp(path.replace('/', '\\/'));
                if (rx.test(req.url)) {
                    authRequired = false;
                }
            });

            if (noAuthPaths.includes(req.url)) {
                authRequired = false;
            }

            if (!authRequired) {
                next();
            } else {
                return auth.check.Cookie(req, res).then((dbSession) => {
                    if (dbSession) {
                        next();
                    } else {
                        res.clearCookie('advdb');
                        return Promise.reject({
                            noCookie: true,
                            reason: 'Not Found On Database',
                        });
                    }
                }).catch((error) => {
                    if (error.noCookie) {
                        fs.readFile(path.join(__dirname, '../templates', 'login.html'), 'utf8', (error, loginPage) => {
                            if (error) {
                                console.error(error);
                                res.status(500).end();
                            } else {
                                res.send(loginPage).end();
                            }
                        });
                    } else {
                        console.error(moment().format('YYYY-MM-DD HH:mm:ss'), 'ErrACS-ACC', error);
                    }
                });
            }
        },
    },
};

auth.enticate = function(details) {
    return Promise.resolve().then((next) => {
        details.username = auth.rsa.decrypt(details.username, 'utf8');
        details.password = auth.rsa.decrypt(details.password, 'utf8');

        let query = sql.select().field('UID').field('USERNAME').field('PASSWORD').from('advdb._users').where('USERNAME = ?', details.username).limit(1);
        return db.execute(query, 1);
    }).then((dbDetails) => {
        if (!dbDetails) {
            return Promise.reject({
                authError: true,
                message: 'Username/Password combination does not match.',
            });
        } else {
            details.uid = dbDetails.UID;
            return internal.password.check(details.password, dbDetails.PASSWORD);
        }
    }).then((passwordVerified) => {
        if (passwordVerified) {
            delete details.password;
            return Promise.resolve(details);
        } else {
            return Promise.reject({
                authError: true,
                message: 'Username/Password combination does not match.',
            });
        }
    }).then((details) => {
        let query = sql.select().from('advdb._sessions').where('UID = ?', details.uid).where('CREATED > DATE_SUB(CURRENT_DATE, INTERVAL 14 DAY)').order('CREATED', false).limit(1);
        return db.execute(query, 1);
    }).then((session) => {
        if (session) {
            return Promise.resolve({
                uid: details.uid,
                token: session.TOKEN,
                expires: moment(session.CREATED, 'YYYY-MM-DD HH:mm:ss').add(2, 'weeks'),
            });
        } else {
            let token = CryptoJS.HmacSHA512(details.uid, moment().format('x')).toString();
            let query = sql.insert().into('advdb._sessions').set('UID', details.uid).set('TOKEN', token);
            db.execute(query);
            return Promise.resolve({
                uid: details.uid,
                token: token,
                expires: moment().add(2, 'weeks'),
            });
        }
    });
};
auth.orize = function(req, res, perms = false) {
    return auth.check.Cookie(req, res).then((dbSession) => {
        if (dbSession) {
            let user = {
                uid: dbSession.UID,
                username: dbSession.USERNAME,
            }
            return Promise.resolve(user);
        } else {
            res.clearCookie('advdb');
            return Promise.reject({
                noCookie: true,
                reason: 'Not Found On Database',
            });
        }
    }).then((user) => {
        if (!perms) {
            return Promise.resolve(user);
        } else {
            console.log('WARNING! Perms Not Yet Defined');
            user.notAuthorised = true;
            return Promise.reject(user);
        }
    });
};

var internal = {
    config: {
        hashBytes: 32,
        saltBytes: 16,
        digest: 'whirlpool',
        iterations: 777777,
        hex: global.config.hex,
    },
    password: {
        hash: function(password) {
            return Promise.resolve().then((next) => {
                return new Promise((resolve, reject) => {
                    crypto.randomBytes(internal.config.saltBytes, (error, salt) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(salt);
                        }
                    });
                });
            }).then((salt) => {
                return new Promise((resolve, reject) => {
                    crypto.pbkdf2(password, salt, internal.config.iterations, internal.config.hashBytes, internal.config.digest, (error, hash) => {
                        if (error) {
                            reject(error);
                        } else {
                            let dbHash = Buffer.alloc(hash.length + salt.length + 8)
                            dbHash.writeUInt32BE(salt.length, 0, true);
                            dbHash.writeUInt32BE(internal.config.iterations, 4, true);

                            salt.copy(dbHash, 8);
                            hash.copy(dbHash, salt.length + 8);
                            resolve(dbHash);
                        }
                    });
                });
            });
        },
        check: function(password, dbHash) {
            let buffer = Buffer.from(dbHash);

            let saltBytes = buffer.readUInt32BE(0);
            let hashBytes = buffer.length - saltBytes - 8;
            let iterations = buffer.readUInt32BE(4);

            let salt = buffer.slice(8, saltBytes + 8);
            let hash = buffer.slice(8 + saltBytes, saltBytes + hashBytes + 8);
            let digest = internal.config.digest;

            return Promise.resolve().then((next) => {
                return new Promise((resolve, reject) => {
                    crypto.pbkdf2(password, salt, iterations, hashBytes, digest, (error, verify) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(verify.equals(hash));
                        }
                    });
                });
            });
        },
    },
    _createAccount: function() {
        console.log('Setup for testing, to be finished');
        return false;
        return Promise.resolve().then((next) => {
            details.username = auth.rsa.decrypt(details.username, 'utf8');
            details.password = auth.rsa.decrypt(details.password, 'utf8');

            return internal.password.hash(details.password);
        }).then((hashed) => {
            let query = {
                text: "INSERT INTO advdb._users SET ?",
                values: {
                    UID: 'abc',
                    USERNAME: 'Josh',
                    PASSWORD: hashed,
                }
            }
            return db.execute(query);
        }).then((sqlResults) => {
            console.log(sqlResults)
        }).catch((error) => {
            console.log(error);
        });
    },
}

module.exports = auth;
