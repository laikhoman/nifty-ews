'use strict';
var express = require('express');
var router = express.Router();
var db = require('./mongo_db');
var ObjectId = require('mongodb').ObjectId;
var lang = require('./languageconfig');
var flash = require('express-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');

router.use(lang.init);
router.use(cookieParser());
router.use(session({
    secret: '222222'
}));
router.use(flash());


/* GET users listing. */
router.get('/', isAuthenticated, function(req, res, next) {
    var dbo = db.get();
    var myquery = {
        "rolename": req.session.role_slug
    };
    var access_data = [];
    var data = [];
    var mysort = {
        date: -1
    };
    var noquery = {
        "user": ObjectId(req.session.user_id),
        status: 1
    };
    dbo.collection("notification_badges").find(noquery).sort(mysort).toArray(function(err, notiresult) {
        dbo.collection("notification_badges").find({
            status: 1
        }).sort(mysort).toArray(function(err, adminnoti) {
            if (req.session.admin_access == 1) {
                data = adminnoti;
            } else {
                data = notiresult;
            }

            res.render('notificationlist/notificationlist', {
                title: 'Notificationlist',
                session: req.session,
                messages: req.flash(),
                data: data
            });
        });
    });
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
                    if (result[0].access_type.notes != undefined) {
                        if (result[0].access_type.notes.view != undefined) {
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