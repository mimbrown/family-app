/* jshint esversion: 6 */

'use strict';

const { Pool } = require('pg');
const pool = new Pool();

const execute = (query, values) =>
    pool.connect()
        .then(client => client.query(query, values)
            .then(res => {
                client.release();
                return Promise.resolve(res);
            })
            .catch(err => {
                client.release();
                return Promise.reject(err);
            })
        );

module.exports = { execute };