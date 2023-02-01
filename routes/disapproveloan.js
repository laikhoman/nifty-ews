'use strict';
var express = require('express');
var router = express.Router();
var db = require('./mongo_db');
var ObjectId = require('mongodb').ObjectId;
var Mail = require('./email');
var flash = require('express-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');

router.use(cookieParser());
router.use(session({
    secret: '222222'
}));
router.use(flash());

/* GET users listing. */
router.get('/', isAuthenticated, function(req, res, next) {
    var dbo = db.get("BankingSystem");
    dbo.collection("loan_details").count({}, function(error, numOfDocs) {
        if (error) return callback(error);

        var query = {
            $and: [{
                status: 1
            }, {
                approvestatus: 1
            }]
        };
        dbo.collection("loan_details").count((query), function(error, approveloan) {
            if (error) return callback(error);

            var query = {
                $and: [{
                    status: 1
                }, {
                    approvestatus: 0
                }]
            };
            dbo.collection("loan_details").count((query), function(error, disapproveloan) {
                if (error) return callback(error);

                var myquery = {
                    "rolename": req.session.role_slug
                };
                var access_data = [];
                dbo.collection("Access_Rights").find(myquery).toArray(function(err, access) {

                    for (const [key, value] of Object.entries(access)) {

                        for (const [key1, value1] of Object.entries(value['access_type'])) {
                            if (key1 == "disapproveloanlist") {
                                access_data = value1;
                            }
                        }
                    };

                    var path = __basedir + "/public/images/upload/";
                    var path1 = __basedir;
                    res.render('loan/disapproveloan', {
                        title: 'Disapproved Loans',
                        path: path,
                        path1: path1,
                        count: numOfDocs,
                        approveloan: approveloan,
                        disapproveloan: disapproveloan,
                        session: req.session,
                        messages: req.flash(),
                        accessrightdata: access_data
                    });
                });
            });
        });
    });
});
router.get('/disapproveloan', isAuthenticated, function(req, res, next) {
    // var dbo = db.get();

    var dbo = db.get("BankingSystem");
    var query = {
        status: 0
    };

    dbo.collection("loan_details").find(query).toArray(function(err, result) {
        if (err) throw err;
        // res.setHeader('Content-Type', 'application/json');

        res.json(result);
        //res.json({ data: result });
    });
});
router.get('/delete/:id', isAuthenticated, function(req, res) {
    var dbo = db.get("BankingSystem");
    var id = req.params.id;
    var myquery = {
        _id: id
    };
    dbo.collection("loan_details").remove({
        _id: new ObjectId(id)
    }, function(err, result) {
        if (err) {

        }

    });
    res.redirect('/loan/loan_details');
});

function isAuthenticated(req, res, next) {
    var dbo = db.get();
    if (req.session.username != undefined) {
        if (req.session.admin_access == 1) {
            return next();
        } else {
            var query = {
                "rolename": req.session.role_slug
            };
            dbo.collection("Access_Rights").find(query).toArray(function(err, result) {
                if (result[0].access_type != undefined) {
                    if (result[0].access_type.disapproveloanlist != undefined) {
                        if (result[0].access_type.disapproveloanlist.view != undefined) {
                            return next();
                        } else {
                            res.redirect('/dashboard');
                        }
                    } else {
                        res.redirect('/dashboard');
                    }
                } else {
                    res.redirect('/dashboard');
                }
            });
        }
    } else {
        res.redirect('/');
    }
};

module.exports = router;