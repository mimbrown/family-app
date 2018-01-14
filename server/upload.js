const travels = [{
    "address": "1260 Mount Estes Dr",
    "city": "Colorado Springs",
    "state": "Colorado",
    "zip": "80921",
    "lat": 39.008688,
    "lng": -104.801032,
    "type": "live",
    "start_date": "2015-06-20",
    "end_date": "2015-08-01"
}, {
    "address": "",
    "city": "Riverside",
    "state": "California",
    "zip": "92501",
    "lat": 33.949698,
    "lng": -117.397814,
    "type": "travel",
    "start_date": "2015-06-26",
    "end_date": "2015-06-29"
}, {
    "address": "8149 E Selway Ct",
    "city": "Nampa",
    "state": "Idaho",
    "zip": "83687",
    "lat": 43.623350,
    "lng": -116.556186,
    "type": "travel",
    "start_date": "2015-07-20",
    "end_date": "2015-07-27"
}, {
    "address": "1907 Digger Dr Unit 88",
    "city": "Golden",
    "state": "Colorado",
    "zip": "80401",
    "lat": 39.741865,
    "lng": -105.224631,
    "type": "live",
    "start_date": "2015-08-01",
    "end_date": "2016-06-30"
}, {
    "address": "4264 W Pondview Pl",
    "city": "Littleton",
    "state": "Colorado",
    "zip": "80123",
    "lat": 39.605487,
    "lng": -105.041491,
    "type": "live",
    "start_date": "2016-07-02",
    "end_date": "2017-04-30"
}, {
    "address": "11265 W Ford Dr",
    "city": "Lakewood",
    "state": "Colorado",
    "zip": "80226",
    "lat": 39.696947,
    "lng": -105.124411,
    "type": "live",
    "start_date": "2017-04-30",
    "end_date": null
}];
require('dotenv').config();
const query = require('pg-server');

let cols = [];
let allVals = [];
travels.forEach(t => {
    let {lat, lng} = t;
    delete t.lat;
    delete t.lng;
    t.location = `ST_MakePoint(${lng}, ${lat})`
})

let t = travels[0];
let k;
for (k in t) {
    cols.push(k);
}

travels.forEach(t => {
    let vals = [];
    for (k in t) {
        vals.push(k === 'location' ? t[k] : t[k] === null ? 'NULL' : `'${t[k]}'`);
    }
    allVals.push(vals);
})

let q = `INSERT INTO travel\n(${cols})\nVALUES\n(${allVals.join('),\n(')})`;
query.execute(q)
    .then(res => console.log(res))
    .catch(err => console.error(err));

// ST_MakePoint(ST_SetSRID(lng, lat))

