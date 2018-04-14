/* jshint esversion: 6 */

const { Pool } = require('pg');
let pool;
let tables = {};
let tableQuery = 
`SELECT DISTINCT
a.attname as name,
format_type(a.atttypid, a.atttypmod) as type,
a.attnotnull as notnull,
coalesce(i.indisprimary,false) as primary_key,
def.adsrc as default
FROM pg_attribute a
JOIN pg_class pgc ON pgc.oid = a.attrelid
LEFT JOIN pg_index i ON
(pgc.oid = i.indrelid AND i.indkey[0] = a.attnum)
LEFT JOIN pg_description com on
(pgc.oid = com.objoid AND a.attnum = com.objsubid)
LEFT JOIN pg_attrdef def ON
(a.attrelid = def.adrelid AND a.attnum = def.adnum)
WHERE a.attnum > 0 AND pgc.oid = a.attrelid
AND pg_table_is_visible(pgc.oid)
AND NOT a.attisdropped
AND pgc.relname = $1`;
let columnRegex = /^[\w\$]+(?:(?: +as)? +[\w\$]+)?$/i;

const resolve = table => {
    return new Promise((resolve, reject) => {
        if (!(table in tables)) {
            tables[table] = true;
            execute(tableQuery, [table])
            .then(res => {
                let columns = res.rows;
                if (!columns.length) {
                    return reject(`Table ${table} does not exist or does not contain any columns.`);
                }
                tables[table] = columns;
                resolve();
            })
            .catch(err => {
                reject(err);
            });
        } else {
            resolve();
        }
    });
};

const resolveColumn = (pref, col) => {
    col = col.trim();
    return columnRegex.test(col) ? pref + col : col;
}

const execute = (query, values) => {
    console.log(query, values);
    return new Promise((resolve, reject) => {
        pool.connect()
        .then(client => client.query(query, values)
            .then(res => {
                client.release();
                resolve(res);
            })
            .catch(err => {
                client.release();
                reject(err);
            })
        );
    });
};

const createWhere = (req, filters) => {
    let where = [];
    let queryValues = [];
    let count = 0;
    let clause, values, value, fillers;
    let i, len1, j, len2;
    let replacePlaceholder = (str) => {
        return `$${++count}`;
    };
    for (i = 0, len1 = filters.length; i < len1; i++) {
        clause = filters[i];
        if (typeof clause === 'string') {
            where.push(clause);
        } else {
            values = clause.values instanceof Array ? clause.values : [clause.values];
            fillers = [];
            for (j = 0, len2 = values.length; j < len2; j++) {
                value = values[j];
                if (value.name in req[value.in]) {
                    fillers.push(req[value.in][value.name]);
                } else if (value.default) {
                    fillers.push(value.default);
                } else {
                    j = len2;
                }
            }
            if (fillers.length === values.length) {
                where.push(clause.sql.replace(/\?/g, replacePlaceholder));
                queryValues = queryValues.concat(fillers);
            }
        }
    }
    return {
        where: where.length ? where.join(' AND ') : null,
        values: queryValues
    };
};

const createGet = (table, options = {}) => {
    let cols;
    let { include = [], extra = [], join, ignore, filters = [], groupBy, orderBy } = options;
    let select = include.concat(extra);
    let from = [`${table} AS t1`];
    let query;

    resolve(table)
    .then(() => {
        cols = tables[table];
        let pref = join ? 't1.' : '',
            i, len, j, len2, name, joinTable, on;
        if (!include.length) {
            for (i = 0, len = cols.length; i < len; i++) {
                name = cols[i].name;
                if (!(ignore && ignore.includes(name))) {
                    select.push(resolveColumn(pref, name));
                }
            }
        }
        if (join) {
            for (i = 0, len = join.length; i < len; i++) {
                joinTable = join[i];
                pref = `t${i + 2}`;
                name = `${joinTable.type || 'JOIN'} ${joinTable.table} AS ${pref}`;
                on = joinTable.on;
                if (on) {
                    name += ' ON ' + on;
                }
                from.push(name);
                pref += '.';
                cols = joinTable.columns;
                if (cols) {
                    for (j = 0, len2 = cols.length; j < len2; j++) {
                        select.push(resolveColumn(pref, cols[j]));
                    }
                }
            }
        }
        query = `SELECT ${select} FROM ${from.join(' ')}`;
    });

    return (req, res, next) => {
        let { where, values } = createWhere(req, filters);
        let sql = [query];
        if (where) {
            sql.push(`WHERE ${where}`);
        }
        if (groupBy) {
            sql.push(`GROUP BY ${groupBy}`);
        }
        if (orderBy) {
            sql.push(`ORDER BY ${orderBy}`);
        }
        execute(sql.join(' '), values)
        .then(data => {
            res.queryResponse = data;
            next();
        })
        .catch(err => {
            next(err);
        });
    };
};

const createPost = (table, options = {}) => {
    
};

const createPut = (table, options = {}) => {
    
};

const createDelete = (table, options = {}) => {
    
};

module.exports = (config = {}) => {
    pool = new Pool(config.pgOptions);
    pool.on('error', (err, client) => {
        console.error('Unexpected error on idle client', err);
        process.exit(-1);
    });
    return {
        get: createGet,
        post: createPost,
        put: createPut,
        delete: createDelete
    };
};