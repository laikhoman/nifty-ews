'use strict';
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', isAuthenticated, function(req, res, next) {
    res.send('respond with a resource');
});

function isAuthenticated(req, res, next) {

    if (req.session.username != undefined) {
        return next();
    } else {
        res.redirect('/');
    }

};

module.exports = router;