const eventsRouter = require('express').Router();
const auth = global.auth;
const db = global.db;

const moment = require('moment');

eventsRouter.get('/', (req, res) => {
    auth.orize(req, res).then((data) => {
        let query = db.sql.select().fields([
            
        ])
    })
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
