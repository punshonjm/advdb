const eventsRouter = require('express').Router();
const auth = global.auth;
const db = global.db;

const _ = require('lodash');

const moment = require('moment');

eventsRouter.get('/', (req, res) => {
    auth.orize(req, res).then((data) => {
        let query = db.sql.select().fields([
            'event.EVENT_ID', 'race.RACE_ID', 'leg.LEG_ID',
            'event.START_DATE', 'event.END_DATE', 'event.LOCATION',
            'race.RACE_DATE', 'race.RACE_CATEGORY', 'event.SERIES_ID',
            'leg.LEG_TYPE', 'leg.LEG_DISTANCE', 'leg.LEG_UNIT',
            'event.CREATED_BY', 'event.CREATED_DATE',' createUser.USERNAME AS CREATE_NAME',
            'event.LAST_UPDATE_BY', 'event.LAST_UPDATED', 'editUser.USERNAME AS EDIT_NAME',
        ]).from(
            'advdb.adv_tbl_event_race_leg', 'leg'
        ).left_join(
            'advdb.adv_tbl_event_race',
            'race', 'leg.RACE_ID = race.RACE_ID'
        ).left_join(
            'advdb.adv_tbl_event',
            'event', 'race.EVENT_ID = event.EVENT_ID'
        ).left_join(
            'advdb._users',
            'createUser', 'event.CREATED_BY = createUser.UID'
        ).left_join(
            'advdb._users',
            'editUser', 'event.LAST_UPDATE_BY = editUser.UID'
        ).where(db.sql.expr()
            .and('event.REMOVED IS NULL')
            .and('race.REMOVED IS NULL')
            .and('leg.REMOVED IS NULL')
        );

        return db.execute(query);
    }).then((rows) => {
        let eventRows = _.groupBy(rows, 'EVENT_ID');
        let events = Object.keys(eventRows).map((key) => {
            return internal.rowsToEvent(eventRows[key]);
        });

        return Promise.resolve(events);
    }).then((events) => {
        res.status(200).json(_.groupBy(events, 'EVENT_YEAR')).end();
    }).catch((error) => {
        global.errorHandler(req, res, error);
        console.log(req.method, req.url, error);
    });
});

eventsRouter.post('/new', (req, res) => {
    var params;
    auth.orize(req, res).then((data) => {
        req.body.user = data.uid;
        if (('event' in req.body) && ('races' in req.body)) {
            return Promise.resolve(req.body);
        } else {
            return Promise.reject({ msg: 'Please ensure all required fields have been completed.' });
        }
    }).then((submittedParams) => {
        params = submittedParams;
        params.event.id = internal.generateEventId(params.event.location, params.event.start);
        let query = db.sql.select().field('EVENT_ID').from('advdb.adv_tbl_event').where('EVENT_ID = ?', params.event.id);
        return db.execute(query, 1);
    }).then((eventId) => {
        if (eventId) {
            params.event.id += "_2";
        }

        let eventRow = {
            EVENT_ID: params.event.id,
            START_DATE: moment(params.event.start, 'DD/MM/YYYY').format("YYYY-MM-DD"),
            END_DATE: moment(params.event.end, 'DD/MM/YYYY').format("YYYY-MM-DD"),
            LOCATION: params.event.location,
            CREATED_BY: params.user,
            LAST_UPDATE_BY: params.user,
        }

        if ('series' in params.event) {
            row.SERIES_ID = params.event.series;
        }

        let query = db.sql.insert().into('advdb.adv_tbl_event').setFields(eventRow);
        return db.execute(query);
    }).then((result) => {
        let raceRows = [], legRows = [];

        Object.values(params.races).map((race, y) => {
            let raceRow = {
                EVENT_ID: params.event.id,
                RACE_ID: params.event.id + '_Race' + (y + 1),
                RACE_DATE: moment(race.date, 'DD/MM/YYYY').format("YYYY-MM-DD"),
                RACE_CATEGORY: race.category,
                CREATED_BY: params.user,
                LAST_UPDATE_BY: params.user,
            }

            raceRows.push(raceRow);

            race.legs.map((leg, x) => {
                let legRow = {
                    RACE_ID: raceRow.RACE_ID,
                    LEG_ID: raceRow.RACE_ID + '_Leg' + (x + 1),
                    LEG_TYPE: leg.type,
                    LEG_DISTANCE: leg.distance,
                    LEG_UNIT: leg.unit,
                }

                legRows.push(legRow);
            });
        });

        let queries = [
            db.execute(db.sql.insert().into('advdb.adv_tbl_event_race').setFieldsRows(raceRows)),
            db.execute(db.sql.insert().into('advdb.adv_tbl_event_race_leg').setFieldsRows(legRows))
        ];

        return Promise.all(queries);
    }).then((result) => {
        res.status(200).json({ message: 'Successfully created event!', eventId: params.event.id }).end();
    }).catch((error) => {
        global.errorHandler(req, res, error);
        console.log(req.method, req.url, error);
    });
});

module.exports = eventsRouter;

var internal = {};
internal.generateEventId = function(loc, start) {
    let eventId = 'EVNT_';
    eventId += moment(start, 'DD/MM/YYYY').format('YYYY');
    eventId += '_';
    eventId += loc.slice(0, 1);
    eventId += String.extractMiddle(loc);
    eventId += loc.slice(-1);
    return eventId;
}
internal.rowsToEvent = function(rows) {
    let raceRows = _.groupBy(rows, 'RACE_ID');

    let Event = {
        EVENT_ID: rows[0].EVENT_ID,
        SERIES_ID: rows[0].SERIES_ID,
        EVENT_YEAR: db.sql.date(rows[0].START_DATE, 'YYYY'),
        LOCATION: rows[0].LOCATION,
        START_DATE: db.sql.date(rows[0].START_DATE),
        END_DATE: db.sql.date(rows[0].END_DATE),
        CREATED: {
            BY: rows[0].CREATED_BY,
            NAME: rows[0].CREATE_NAME,
            ON: db.sql.dateTime(rows[0].CREATED_DATE),
        },
        EDITED: {
            BY: rows[0].LAST_UPDATE_BY,
            NAME: rows[0].EDIT_NAME,
            ON: db.sql.dateTime(rows[0].LAST_UPDATED),
        },
        RACES: Object.values(raceRows).map((rows) => {
            let race = {
                RACE_ID: rows[0].RACE_ID,
                RACE_DATE: db.sql.date(rows[0].RACE_DATE),
                RACE_CATEGORY: rows[0].RACE_CATEGORY,
                LEGS: rows.map((row) => {
                    let leg = {
                        LEG_ID: row.LEG_ID,
                        LEG_TYPE: row.LEG_TYPE,
                        LEG_DISTANCE: row.LEG_DISTANCE,
                        LEG_UNIT: row.LEG_UNIT,
                    };

                    return leg;
                }),
            };

            return race;
        }),
    };

    return Event;
}
