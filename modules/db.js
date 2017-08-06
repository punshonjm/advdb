const mysql = require('mysql');

var db = {};

db.pool = mysql.createPool({
    connectionLimit: 10,
    host: global.config.con,
    user: global.config.usr,
    password: global.config.sql,
    database: 'advdb',
    dateString: true,
});

db.execute = function(query, expectingOne = false) {
    return new Promise(function(resolve, reject) {
        db.pool.getConnection((error, connection) => {
            if (error) {
                reject({
                    error: error,
                    note: 'SQL Connection Error',
                });
            } else {
                if (!('text' in query) && !('values' in query)) {
                    query = query.toParam();
                }
                connection.query(query.text, query.values, (error, rows) => {
                    connection.release();
                    if (error) {
                        reject(error);
                    } else {
                        if (expectingOne) {
                            resolve((typeof rows[0] === typeof undefined) ? false : rows[0]);
                        } else {
                            resolve(rows);
                        }
                    }
                });
            }
        });
    });
}

if (!String.isNullOrEmpty) {
    String.isNullOrEmpty = function(value) {
        return !(typeof value === 'string' && value.length > 0);
    }
}

module.exports = db;
