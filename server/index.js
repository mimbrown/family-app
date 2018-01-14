/* jshint esversion: 6 */

require('dotenv').config();
const express = require('express');
const _ = require('lodash');
const bodyParser = require('body-parser');
const fs = require('fs');
const query = require('pg-server');
const path = require('path');
const expressJwt = require('express-jwt');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const router = express.Router();
const port = 80;

const defineRoutes = () => {

    app.use(bodyParser.json());

    app.route('/auth')
        .post(
            query.get({
                from: {
                    table: 'login',
                    alias: 'l'
                },
                joins: [{
                    table: 'member',
                    alias: 'm',
                    fields: ['profile_image'],
                    on: ['l.member_id = m.id']
                }],
                where: [
                    'username = {{value body.username}}'
                ]
            }, {
                next: true
            }),
            (req, res) => {
                let row = req.sql.response.rows[0];
                if (row) {
                    if (bcrypt.compareSync(req.body.password, row.hash)) {
                        res.json({
                            token: jwt.sign({
                                sub: row.member_id,
                                name: row.username,
                                profile_image: row.profile_image
                            }, process.env.SECRET)
                        });
                    } else {
                        res.status(401).json(`Wrong password for user '${req.body.username}'`);
                    }
                } else {
                    res.status(404).json(`Unable to find user '${req.body.username}'`);
                }
            }
        );

    router.route('/members-lite')
        .get(query.get({
            from: {
                table: 'member',
                fields: [
                    'first_name',
                    'profile_image'
                ]
            }
        }));

    router.route('/members')
        .get(query.get({
            from: {
                table: 'member',
                alias: 'm',
                ignore: [
                    'password'
                ]
            },
            joins: [{
                table: 'member_description',
                on: 'm.id = m_d.member_id',
                alias: 'm_d',
                type: 'LEFT JOIN',
                ignore: '*'
            }],
            fields: [
                'JSON_AGG(ROW_TO_JSON(m_d.*) ORDER BY m_d.created_date) descriptions'
            ],
            groupBy: [
                'm.id',
                'm.first_name',
                'm.last_name',
                'm.birth_date'
            ],
            where: [
                'birth_date BETWEEN {{value query.start_dt}} AND {{value query.end_dt}}',
                'last_name <= {{value query.substr}}',
                'password = {{value query.password}}',
                'first_name = {{value query.name}}'
            ]
        }))
        // .post(query.post('member'));

    router.route('/writings')
        .get(query.get({
            from: {
                table: 'resource',
                alias: 'r'
            },
            joins: [{
                table: 'member',
                alias: 'm',
                fields: [
                    'first_name author'
                ],
                on: ['r.member_id=m.id']
            }],
            orderBy: ['date']
        }));
    
    router.route('/travels')
        .get(query.get({
            from: {
                table: 'travel',
                ignore: ['location']
            },
            fields: [
                'ST_X(location) AS lng',
                'ST_Y(location) AS lat'
            ]
        }))

    router.route('/family-tree/:id')
        // .get(function () {
        //     let parents = new query.Raw();
        //     return (req, res, next) => {
        //         let incoming = query.createIncoming(req);
        //         let sql = query.resolve(incoming);
        //         query.execute(sql, incoming.values)
        //             .then()   
        //     };
        // }());
        .get(
            query.raw(`SELECT DISTINCT ON (id) b.*
                FROM family a
                JOIN family_marriage f_m ON a.id IN (f_m.husband_id, f_m.wife_id)
                JOIN family b ON b.id IN (f_m.husband_id, f_m.wife_id)
                WHERE a.id = {{value path.id}} AND b.id != {{value path.id}}
                ORDER BY b.id`,
                {next: true}
            ),
            (req, res, next) => {
                req.toReturn = {
                    spouses: req.sql.response.rows
                };
                next();
            },
            query.raw(`SELECT * FROM family WHERE id = {{value path.id}}`, {next: true}),
            (req, res, next) => {
                req.toReturn.ego = req.sql.response.rows[0];
                next();
            },
            query.raw(`SELECT b.*
                FROM family a
                JOIN family_offspring f_o ON a.id = f_o.parent_id
                JOIN family b ON b.id = f_o.child_id
                WHERE a.id = {{value path.id}}
                ORDER BY b.id`,
                {next: true}
            ),
            (req, res, next) => {
                req.toReturn.children = req.sql.response.rows;
                next();
            },
            query.raw(`SELECT DISTINCT ON (id) b.*
                FROM family a
                JOIN family_offspring f_o ON a.id = f_o.parent_id
                JOIN family b ON b.id = f_o.child_id
                WHERE b.id != {{value path.id}} AND a.id IN (SELECT b.id
                    FROM family a
                    JOIN family_offspring f_o ON a.id = f_o.child_id
                    JOIN family b ON b.id = f_o.parent_id
                    WHERE a.id = {{value path.id}})
                ORDER BY b.id`,
                {next: true}
            ),
            (req, res, next) => {
                req.toReturn.siblings = req.sql.response.rows;
                next();
            },
            query.raw(`SELECT b.*
                FROM family a
                JOIN family_offspring f_o ON a.id = f_o.child_id
                JOIN family b ON b.id = f_o.parent_id
                WHERE a.id = {{value path.id}}
                ORDER BY b.id`,
                {next: true}
            ),
            (req, res) => {
                req.toReturn.parents = req.sql.response.rows;
                res.json(req.toReturn);
            }
        );
    // router.route('/family-tree/:id')
    //     .get(query.raw(`SELECT row_to_json(a.*) AS ego, row_to_json(b.*) AS spouse, (SELECT array_to_json(array_agg(t)) FROM (SELECT a.*, ROW_TO_JSON(b.*) AS spouse, (SELECT COUNT(*) > 0 FROM family_offspring WHERE parent_id = a.id) AS has_children
    //     FROM family a
    //     LEFT JOIN family_marriage f ON CASE WHEN a.gender = 'm' THEN a.id = f.husband_id ELSE a.id = f.wife_id END
    //     LEFT JOIN family b ON CASE WHEN a.gender = 'm' THEN b.id = f.wife_id ELSE b.id = f.husband_id END
    //     JOIN family_offspring f_o ON a.id = f_o.child_id AND f_o.parent_id = {{value path.id}}
    //     ) as t) AS children
    //     FROM family a
    //     JOIN family_marriage f ON CASE WHEN a.gender = 'm' THEN a.id = f.husband_id ELSE a.id = f.wife_id END
    //     JOIN family b ON CASE WHEN a.gender = 'm' THEN b.id = f.wife_id ELSE b.id = f.husband_id END
    //     WHERE a.id = {{value path.id}}`));

    router.use('/chapters', expressJwt({
        secret: process.env.SECRET
    }), (err, req, res, next) => {
        console.log(err);
        res.status(400).json(err);
    });
    router.route('/chapters')
        .get(query.get({
            from: 'chapter',
            fields: [
                `'Chapter ' || chapter_num || ' - ' || title AS display`,
                'chapter_num AS value'
            ]
        }));

    router.all('*', (req, res, next) => {
        if (res.queryResponse) {
            res.json(res.queryResponse.rows);
        } else {
            next();
        }
    });

    app.use('/api', router);
    app.use('/resources', express.static(path.join(__dirname, '../family-app/src/resources/public')));
    // app.use('/resources', query.get({

    // }, {
    //     next: true
    // }));
    app.use('/resources', express.static(path.join(__dirname, '../family-app/src/resources/protected')));
    app.use('/resources', express.static(path.join(__dirname, '../family-app/src/resources/private')));
    app.use('/', express.static(path.join(__dirname, '../family-app/dist')));

    switch (process.env.NODE_ENV) {
        case 'development':
        // app.use('/node_modules', express.static('../node_modules/'));
        // app.use('/', express.static('../build/development'));
        // app.use('/development', express.static('../site/pages'));
        // app.use('/styles', express.static('../site/styles'));
        // app.use('/scripts', express.static('../site/scripts'));
        // app.use('/resources', express.static('../site/resources'));
        // app.get('/development/:page/templates/all', (req, res, next) => {
        //     let dir = `../site/pages/${req.params.page}/templates/`,
        //         files = fs.readdirSync(dir),
        //         templates = {};
        //     files.forEach((file) => {
        //         templates[file.split('.')[0]] = fs.readFileSync(dir + file).toString('utf8');
        //     });
        //     dir = `../site/templates/`;
        //     files = fs.readdirSync(dir);
        //     files.forEach((file) => {
        //         templates[file.split('.')[0]] = fs.readFileSync(dir + file).toString('utf8');
        //     });
        //     res.json(templates);
        // });
        break;

        default:

    }

    app.listen(port, function() {
        console.log(`Server listening on port ${port}`);
    });
};

query.defineTables(['member', 'member_description', 'chapter', 'resource', 'login', 'travel'])
    .then(defineRoutes)
    .catch(err => console.error(err));