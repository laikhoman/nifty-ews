'use strict';
var express = require('express');
var router = express.Router();
var db = require('./mongo_db');
var ObjectId = require('mongodb').ObjectId;
var flash = require('express-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var moment = require('moment');
router.use(cookieParser());
router.use(session({
    secret: '222222'
}));
router.use(flash());

/* GET users listing. */
router.route('/:id?')
    .get(isAuthenticated, function(req, res) {
        var dbo = db.get();
        var id = req.params.id;
        if (id) {
            var myquery = {
                "_id": ObjectId(id)
            };
            dbo.collection("notificationtemplate").find(myquery).toArray(function(err, result) {
                res.render('notification/addnotificationtemplate', {
                    title: "Edit Notification Template ",
                    data: result,
                    id: id,
                    session: req.session
                });
            });
        } else {
            var news = [{
                'userid': '-1'
            }];
            res.render('notification/addnotificationtemplate', {
                title: "Add Notification Template ",
                data: news,
                session: req.session
            });
        }
    })

.post(isAuthenticated, function(req, res) {
    var id = req.body.id;
    if (id) {
        var myquery = {
            "_id": ObjectId(id)
        };
        var dbo = db.get();
        var newvalues = {
            $set: {
                notificationtype: req.body.notificationtype,
                slug: req.body.slug,
                templatetitle: req.body.templatetitle,
                subject: req.body.subject,
                content: req.body.content,
            }
        };
        dbo.collection("notificationtemplate").updateOne(myquery, newvalues, function(err, result) {
            var date = Date(Date.now());
            var formatdate = moment(date).format("YYYY-MM-DD");
            var myobj = {
                date: formatdate,
                module: "Notification Template",
                action: "updated template",
                user: ObjectId(req.session.user_id),
                item: req.body.templatetitle,
                status: 0,
            };
            dbo.collection("activitylog").insertOne(myobj, function(err, activity) {});
            if (err) {
                req.flash('error', 'Error occured.');
                res.redirect('/notification/notificationtemplate');
            } else {
                req.flash('success', 'Notification Template  Updated Sucessfully.');
                res.redirect('/notification/notificationtemplate');
            }
        });
    } else {
        var dbo = db.get();
        var myobj = {
            notificationtype: req.body.notificationtype,
            slug: req.body.slug,
            templatetitle: req.body.templatetitle,
            subject: req.body.subject,
            content: req.body.content,
        };
        dbo.collection("notificationtemplate").insertOne(myobj, function(err, result) {
            var date = Date(Date.now());
            var formatdate = moment(date).format("YYYY-MM-DD");
            var myobj = {
                date: formatdate,
                module: "Notification Template",
                action: "inserted template",
                user: ObjectId(req.session.user_id),
                item: req.body.templatetitle,
                status: 0,
            };
            dbo.collection("activitylog").insertOne(myobj, function(err, activity) {});
            if (err) {
                req.flash('error', 'Error occured.');
                res.redirect('/notification/notificationtemplate');
            } else {
                req.flash('success', 'Notification Template Inserted Sucessfully.');
                res.redirect('/notification/notificationtemplate');
            }
        });
    }
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
                if (req.url == "/") {
                    if (result[0].access_type != undefined) {
                        if (result[0].access_type.notification != undefined) {
                            if (result[0].access_type.notification.add != undefined) {
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
                } else {
                    if (result[0].access_type != undefined) {
                        if (result[0].access_type.notification != undefined) {
                            if (result[0].access_type.notification.update != undefined) {
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
                }
            });
        }
    } else {
        res.redirect('/');
    }
};

module.exports = router;