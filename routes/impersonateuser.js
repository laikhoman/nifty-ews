'use strict';
var express = require('express');
var router = express.Router();
var db = require('./mongo_db');
var ObjectId = require('mongodb').ObjectId;
var lang = require('./languageconfig');
var flash = require('express-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var moment = require('moment');

router.use(lang.init);
router.use(cookieParser());
router.use(session({
    secret: '222222'
}));
router.use(flash());


router.route('/:id?')
    .get(isAuthenticated, function(req, res) {
        var languages = lang.getLocale();
        var dbo = db.get();
        var id = req.params.id;
        res.render('impersonate/impersonateuser', {
            title: "Impersonate",
            session: req.session,
            messages: req.flash()
        });

    })
    .post(isAuthenticated, function(req, res) {
        var dbo = db.get();
        var myquery = {
            "email": req.body.email
        };
        var query = {
            "_id": ObjectId(req.session.user_id)
        };
        var mail = req.body.email;
        var impersonate = [];
        dbo.collection("Users").find(myquery).toArray(function(err, result) {
            dbo.collection("Users").find(query).toArray(function(err, admindata) {
                impersonate = {
                    'username': admindata[0].username,
                    'password': req.session.password
                };
                if (err) throw err;
                else {
                    if (req.body.email != req.session.email) {
                        if (result.length > 0) {
                            req.session.email = result[0].email;
                            req.session.username = result[0].username;
                            req.session.photo = result[0].photo;
                            req.session.user_id = result[0]._id;
                            req.session.role = result[0].role;
                            req.session.impersondata = impersonate;
                            var myquery1 = {
                                "id": req.body._id
                            };
                            dbo.collection("Generalsetting").find(myquery1).toArray(function(err, result1) {

                                dbo.collection("Role").find({
                                    "_id": result[0].role
                                }).toArray(function(err, roledata) {
                                    if (err) throw err;
                                    else {
                                        var language = result1[0].language;
                                        res.cookie('locale', language, {
                                            maxAge: 900000,
                                            httpOnly: true
                                        });

                                        req.session.gen_id = result1[0]._id;
                                        req.session.company_logo = result1[0].company_logo;
                                        req.session.generaldata = result1[0];
                                        req.session.role_slug = roledata[0].role_slug;
                                        req.session.admin_access = roledata[0].admin_access;

                                        var date = Date(Date.now());
                                        var formatdate = moment(date).format("YYYY-MM-DD");

                                        if (roledata[0].role_slug == 'admin' || roledata[0].role_slug == 'superadmin') {
                                            var query = {
                                                "date": formatdate,
                                                "status": 0
                                            };
                                            dbo.collection("emi_details").find(query).toArray(function(err, resulted) {
                                                var data = [];
                                                resulted.forEach(element => {
                                                    var myquery = {
                                                        "_id": element['_id']
                                                    };

                                                    var newvalues = {
                                                        $set: {
                                                            status: 1,
                                                        }
                                                    };
                                                    dbo.collection("emi_details").updateOne(myquery, newvalues, function(err, resulted) {
                                                        if (err) {

                                                        } else {

                                                        }
                                                    });
                                                });

                                            });
                                        } else {
                                            var query = {
                                                "user_id": result[0]._id,
                                                "status": 1,
                                                "date": formatdate
                                            };
                                        }
                                    }
                                    res.redirect('/dashboard');
                                });
                            });
                        } else {
                            req.flash('error', 'Invalid Email.You cannot impersonate this user.');
                            res.redirect("/impersonate/impersonateuser");
                        }
                    } else {
                        req.flash('error', 'You cannot impersonate yourself.');
                        res.redirect("/impersonate/impersonateuser");
                    }
                }
            });
        });
    })

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
                    if (result[0].access_type.impersonate != undefined) {
                        if (result[0].access_type.impersonate.view != undefined) {
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