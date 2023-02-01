'use strict';
var express = require('express');
var router = express.Router();
var db = require('./mongo_db');
var lang = require('./languageconfig');
var ObjectId = require('mongodb').ObjectId;
var flash = require('express-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');

router.use(cookieParser());
router.use(session({
    secret: '222222'
}));
router.use(flash());
router.use(lang.init);



/* GET users listing. */
router.get('/', isAuthenticated, function(req, res, next) {
    var dbo = db.get("BankingSystem");

    var myquery = {
        "rolename": req.session.role_slug
    };
    var access_data = [];
    dbo.collection("Access_Rights").find(myquery).toArray(function(err, access) {

        for (const [key, value] of Object.entries(access)) {

            for (const [key1, value1] of Object.entries(value['access_type'])) {
                if (key1 == "user") {
                    access_data = value1;
                }
            }
        };
        var path = __basedir + "/public/images/upload/";
        var path1 = __basedir;
        if (req.session.admin_access == 0) {
            if (req.session.access_rights.user.owndata) {

                var query = {
                    _id: ObjectId(req.session.user_id)
                };
                dbo.collection("Users").count((query), function(error, numOfDocs) {
                    if (error) return callback(error);

                    var query = {
                        status: 1,
                        _id: ObjectId(req.session.user_id)
                    };
                    dbo.collection("Users").count((query), function(error, activeuser) {
                        if (error) return callback(error);

                        var query = {
                            status: 0,
                            _id: ObjectId(req.session.user_id)
                        };
                        dbo.collection("Users").count((query), function(error, deactiveuser) {
                            if (error) return callback(error);


                            res.render('users/userlist', {
                                title: 'User List',
                                path: path,
                                path1: path1,
                                count: numOfDocs,
                                activecount: activeuser,
                                deactivecount: deactiveuser,
                                session: req.session,
                                accessrightdata: access_data,
                                messages: req.flash()
                            });
                        });

                    });
                });
            } else {

                dbo.collection("Users").count({}, function(error, numOfDocs) {
                    if (error) return callback(error);

                    var query = {
                        status: 1
                    };
                    dbo.collection("Users").count((query), function(error, activeuser) {
                        if (error) return callback(error);

                        var query = {
                            status: 0
                        };
                        dbo.collection("Users").count((query), function(error, deactiveuser) {
                            if (error) return callback(error);


                            res.render('users/userlist', {
                                title: 'User List',
                                path: path,
                                path1: path1,
                                count: numOfDocs,
                                activecount: activeuser,
                                deactivecount: deactiveuser,
                                session: req.session,
                                accessrightdata: access_data,
                                messages: req.flash()
                            });
                        });

                    });
                });

            }
        } else {
            dbo.collection("Users").count({}, function(error, numOfDocs) {
                if (error) return callback(error);

                var query = {
                    status: 1
                };
                dbo.collection("Users").count((query), function(error, activeuser) {
                    if (error) return callback(error);

                    var query = {
                        status: 0
                    };
                    dbo.collection("Users").count((query), function(error, deactiveuser) {
                        if (error) return callback(error);


                        res.render('users/userlist', {
                            title: 'User List',
                            path: path,
                            path1: path1,
                            count: numOfDocs,
                            activecount: activeuser,
                            deactivecount: deactiveuser,
                            session: req.session,
                            accessrightdata: access_data,
                            messages: req.flash()
                        });
                    });

                });
            });
        }
    });
});

function isAuthenticated(req, res, next) {

    if (req.session.username != undefined) {
        if (req.session.admin_access == 1) {
            return next();
        } else {
            var dbo = db.get();
            var query = {
                "rolename": req.session.role_slug
            };
            dbo.collection("Access_Rights").find(query).toArray(function(err, result) {
                if (result[0].access_type != undefined) {

                    if (result[0].access_type.user != undefined) {
                        if (result[0].access_type.user.view != undefined) {
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