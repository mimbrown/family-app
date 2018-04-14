const {Select, defineTables, execute, createIncoming, get} = require('./_index');
const express = require('express');
const app = express();

defineTables(['acl_group', 'acl_right'])
.then(() => {
    app.get('/test', get({
        fields: ['now() AS date_retrieved'],
        from: {
            table: 'acl_group',
            alias: 'a_g'
        },
        joins: [{
            table: 'acl_right',
            alias: 'a_r',
            ignore: ['acl_group_id'],
            on: 'a_g.acl_group_id=a_r.acl_group_id'
        }]
        // from: {
        //     table: {
        //         from: 'test',
        //         joins: [{
        //             table: 'test',
        //             alias: 't'
        //         }]
        //     }
        // },
        // distinct: 'id',
        // joins: [{
        //     table: 'test'
        // }]
    }));
    app.listen(4000, () => {
        console.log('App listening on port 4000');
    });
    
    // let test = {
    //     from: {
    //         table: 'acl_group'
    //     },
    //     joins: [{
    //         table: 'acl_right',
    //         ignore: ['acl_group_id']
    //     }]
    //     // from: {
    //     //     table: {
    //     //         from: 'test',
    //     //         joins: [{
    //     //             table: 'test',
    //     //             alias: 't'
    //     //         }]
    //     //     }
    //     // },
    //     // distinct: 'id',
    //     // joins: [{
    //     //     table: 'test'
    //     // }]
    // };
    // let a = new Select(test);
    // console.log(a.resolve(createIncoming({
    //     query: {
    //         string_col: 'test'
    //     },
    //     params: {
    //         id: '3'
    //     }
    // })));
})
.catch(err => console.error(err));

// execute('SELECT now() - INTERVAL \'1 day\'')
//     .then(res => console.log(res))
//     .catch(err => console.error(err));