'use strict';
var express = require('express');
var router = express.Router();
var db = require('./mongo_db');
var ObjectId = require('mongodb').ObjectId;
var lang = require('./languageconfig');
var moment = require('moment');
router.use(lang.init);
var flash = require('express-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');

router.use(cookieParser());
router.use(session({
    secret: '222222'
}));
router.use(flash());

/* GET loan listing. */
router.get('/', isAuthenticated, function(req, res, next) {
    var dbo = db.get();
    var date = new Date(Date.now());
    var formatdate = moment(date).format("YYYY-MM-DD");

    dbo.collection("emi_details").aggregate([{
        $lookup: {
            from: "loan_details",
            localField: "loan_id",
            foreignField: "_id",
            as: "loan"
        }
    }, {
        $unwind: "$loan"
    }, {
        $lookup: {
            from: "Users",
            localField: "user_id",
            foreignField: "_id",
            as: "user"
        }
    }, {
        $unwind: "$user"
    }, {
        $match: {
            $and: [{
                date: {
                    $lt: formatdate
                }
            }, {
                status: 0
            }]
        }
    }]).toArray(function(err, result) {
        if (err) throw err;
        res.render('loan/loanreports', {
            title: 'Loans',
            session: req.session,
            data: result
        });
    });

});

function isAuthenticated(req, res, next) {
    if (req.session.username != undefined) {
        return next();
    } else {
        res.redirect('/');
    }
};

module.exports = router;