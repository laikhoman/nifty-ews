'use strict';
var express = require('express');
var router = express.Router();
var lang = require('./languageconfig');
router.use(lang.init);
/* GET users listing. */
router.get('/', function(req, res, next) {
  // res.send('respond with a resource');
  
});

module.exports = router;
