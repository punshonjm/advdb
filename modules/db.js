const mysql = require('mysql');
const Squel = require('squel');
const Moment = require('moment');

var db = {};

db.pool = mysql.createPool({
    connectionLimit: 10,
    host: global.config.con,
    user: global.config.usr,
    password: global.config.sql,
    database: 'advdb',
    dateString: true,
});

db.mysql = mysql;
db.sql = Squel;

db.sql.date = function(column, format = 'DD/MM/YYYY') {
    return Moment(column, 'YYYY-MM-DD').format(format);
};
db.sql.dateTime = function(column, format = 'DD/MM/YYYY h:mm a') {
    return Moment(column, 'YYYY-MM-DD HH:mm:ss').format(format);
};

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
    Object.defineProperty(String, 'isNullOrEmpty', {
        value: function(val) {
            return !(typeof value === 'string' && value.length > 0);
        },
        enumerable: false,
    });
}

if (!String.extractMiddle) {
    Object.defineProperty(String, 'extractMiddle', {
        value: function(str) {
            var position, length;

            if(str.length % 2 == 1) {
                position = str.length / 2;
                length = 1;
            } else {
                position = str.length / 2 - 1;
                length = 2;
            }

            return str.substring(position, position + length)
        },
        enumerable: false,
    })
}

module.exports = db;
