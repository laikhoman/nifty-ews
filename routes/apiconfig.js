'use strict';
var express = require('express');
var router = express.Router();
const https = require('https');

router.get('/', isAuthenticated, function(req, res, next) {
    https.get('https://apideveloper.rblbank.com/test/sb/rbl/api/create_VA/create_VA', (resp) => {
        let data = '';

        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            console.log(JSON.parse(data));
            console.log(data);
            console.log('Api called....');
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
    res.render('users/apiconfig', {
        title: 'NiftyEWS',
        session: req.session
    });
});

function isAuthenticated(req, res, next) {
    if (req.session.username != undefined) {
        return next();
    } else {
        res.render('login', {
            title: 'NiftyEWS',
            layout: "loginlayout"
        });
    }
};
module.exports = router;