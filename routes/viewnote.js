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
router.route('/:id?')
    .get(isAuthenticated, function(req, res) {
        var dbo = db.get();
        var id = req.params.id;
        if (id) {
            var myquery = {
                "_id": ObjectId(id)
            };
            dbo.collection("notes").find(myquery).toArray(function(err, note) {
                res.render('notes/viewnote', {
                    title: "View Note",
                    data: note,
                    id: id,
                    session: req.session
                });
            });
        } else {
            var news = [{
                'userid': '-1'
            }];
            res.render('notes/viewnote', {
                title: 'View Note',
                data: news,
                session: req.session,
                messages: req.flash()
            });
        }
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