'use strict';
var express = require('express');
var router = express.Router();
var i18n = require('i18n');


i18n.configure({
    locales: ['en', 'fr', 'hi', 'sp'],
    cookie: 'locale',
    directory: "./locales",
    register: global,
    extension: '.json',
    logDebugFn: function(msg) {},

    // setting of log level WARN - default to require('debug')('i18n:warn')
    logWarnFn: function(msg) {},

    // setting of log level ERROR - default to require('debug')('i18n:error')
    logErrorFn: function(msg) {},
    api: {

        '__': '__', //now req.__ becomes req.__
        '__n': '__n' //and req.__n can be called as req.__n
    }
});



module.exports = i18n;