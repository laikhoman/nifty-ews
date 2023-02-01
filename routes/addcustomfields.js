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

/* GET users listing. */
router.route('/:id?')
    .get(isAuthenticated, function(req, res) {
        var dbo = db.get();
        var id = req.params.id;
        if (id) {
            var myquery = {
                "_id": ObjectId(id)
            };
            dbo.collection("customfields").find(myquery).toArray(function(err, result) {
                res.render('customfields/addcustomfields', {
                    title: "Edit Custom Fields",
                    data: result,
                    id: id,
                    session: req.session,
                    messages: req.flash()
                });
            });
        } else {
            var news = [{
                'userid': '-1'
            }];
            res.render('customfields/addcustomfields', {
                title: "Add Custom Fields",
                data: news,
                session: req.session
            });
        }
    })
    .post(isAuthenticated, function(req, res) {
        var id = req.body.id;
        var dbo = db.get();
        // for making array of validation
        var valid = req.body.validation;
		var data = [];
        if (typeof valid === 'string') {
            data.push(valid);
        } else {
             data = valid;
        }
        // for making array of dropdown data
        var dlabel = req.body.d_label;
        var d_label = [];
        if (Array.isArray(dlabel)) {
            d_label = req.body.d_label;
        } else {
            d_label.push(dlabel);
        }
        // for making array of checkbox data
        var clabel = req.body.c_label;
        var c_label = [];
        if (Array.isArray(clabel)) {
            c_label = req.body.c_label;
        } else {
            c_label.push(clabel);
        }
        // for making array of radio button data
        var rlabel = req.body.r_label;
        var r_label = [];
        if (Array.isArray(rlabel)) {
            r_label = req.body.r_label;
        } else {
            r_label.push(rlabel);
        }

        if (id) {
            var myquery = {
                "_id": ObjectId(id)
            };
            var newvalues = {
                $set: {
                    module_name: req.body.module_name,
                    label: req.body.label,
                    field_type: req.body.field_type,
                    validation: data,
                    field_visibility: parseInt(req.body.field_visibility),
                    minival: req.body.minival,
                    maxival: req.body.maxival,
                    d_label: d_label,
                    c_label: c_label,
                    r_label: r_label,
                    filetype: req.body.filetype,
                    filesize: req.body.filesize,
                }
            };

            dbo.collection("customfields").updateOne(myquery, newvalues, function(err, result) {
                var date = Date(Date.now());
                var formatdate = moment(date).format("YYYY-MM-DD");
                var myobj = {
                    date: formatdate,
                    module: "Custom Fields",
                    action: "updated customfield in",
                    user: ObjectId(req.session.user_id),
                    item: req.body.module_name,
                    status: 0,
                };
                dbo.collection("activitylog").insertOne(myobj, function(err, activity) {});
                if (err) {
                    req.flash('error', 'Error occured.');
                    res.redirect('/customfields/customfieldlist');
                } else {
                    req.flash('success', lang.__('Custom Field Updated Sucessfully.'));
                    res.redirect('/customfields/customfieldlist');
                }

            });

        } else {
            var myobj = {
                module_name: req.body.module_name,
                label: req.body.label,
                field_type: req.body.field_type,
                validation: data,
                minival: req.body.minival,
                maxival: req.body.maxival,
                field_visibility: parseInt(req.body.field_visibility),
                d_label: d_label,
                c_label: c_label,
                r_label: r_label,
                filetype: req.body.filetype,
                filesize: req.body.filesize,
            };
            dbo.collection("customfields").insertOne(myobj, function(err, result) {
                var date = Date(Date.now());
                var formatdate = moment(date).format("YYYY-MM-DD");
                var myobj = {
                    date: formatdate,
                    module: "Custom Fields",
                    action: "inserted customfield in",
                    user: ObjectId(req.session.user_id),
                    item: req.body.module_name,
                    status: 0,
                };
                dbo.collection("activitylog").insertOne(myobj, function(err, activity) {});
                if (err) {
                    req.flash('error', 'Error occured.');
                    res.redirect('/customfields/customfieldlist');
                } else {
                    req.flash('success', lang.__('Custom Field added Sucessfully.'));
                    res.redirect('/customfields/customfieldlist');
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
                        if (result[0].access_type.customfield != undefined) {
                            if (result[0].access_type.customfield.add != undefined) {
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
                        if (result[0].access_type.customfield != undefined) {
                            if (result[0].access_type.customfield.update != undefined) {
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