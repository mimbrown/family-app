/* jshint esversion: 6 */

'use strict';

class Incoming {
    constructor (req) {
        if (req) {
            this.query = req.query;
            this.path = req.params;
            this.headers = req.headers;
            this.body = req.body;
        }
        this.values = [];
    }
    begin () {
        this.count = this.values.length;
    }
    rollback () {
        let {count, values} = this;
        let len = values.length;
        if (len > count) {
            values.splice(count, len - count);
        }
    }
}

const createIncoming = (req = {}) => {
    return new Incoming(req);
};

module.exports = {
    Query, Select, Insert, Fields, Raw, execute, createIncoming,
    defineTables: tables => Promise.all(tables.map(resolveRelation)),
    get: (definition, options = {}) => {
        let query = new Select(definition);
        return function (req, res, next) {
            let incoming = createIncoming(req);
            let sql = query.resolve(incoming);
            execute(sql, incoming.values)
            .then(response => {
                // res.json({
                //     sql, values: incoming.values, res: response.rows
                // })
                if (options.next) {
                    req.sql = {
                        response: response
                    };
                    next();
                } else {
                    res.json(response.rows);
                }
            })
            .catch(err => {
                if (options.next) {
                    next(err);
                } else {
                    res.status(400).json({
                        sql, values: incoming.values, err
                    });
                }
            });
        };
    },
    raw: (definition, options = {}) => {
        let query = new Raw(definition);
        return function (req, res, next) {
            let incoming = createIncoming(req);
            let sql = query.resolve(incoming);
            execute(sql, incoming.values)
            .then(response => {
                // res.json({
                //     sql, values: incoming.values, res: response.rows
                // })
                if (options.next) {
                    req.sql = {
                        response: response
                    };
                    next();
                } else {
                    res.json(response.rows);
                }
            })
            .catch(err => {
                if (options.next) {
                    next(err);
                } else {
                    res.status(400).json({
                        sql, values: incoming.values, err
                    });
                }
            });
        };
    }
};