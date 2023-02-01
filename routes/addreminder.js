'use strict';
var express = require('express');
var app = express();
var router = express.Router();
var http = require('http');
var db = require('./mongo_db');
var ObjectId = require('mongodb').ObjectId;
var bodyParser = require('body-parser');
var md5 = require('md5');
var flash = require('express-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var fs = require('fs');
var Mail = require('./email');
var moment = require('moment');
var lang = require('./languageconfig');
router.use(lang.init);
/////////////// FOR IMAGE SAVE
var multer = require('multer');
var jsonParser = bodyParser.json();
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({
    extended: false
});
var storage = multer.diskStorage({
    // file upload destination
    destination: function(req, file, callback) {
        callback(null, 'public/images/upload');
    },
    filename: function(req, file, callback) {
        callback(null, Date.now() + '-' + file.originalname);
    }
});
var upload = multer({
    storage: storage
});
/////////////// IMAGE SAVE END

// FOR GETTING VALUE IN FORM EDIT
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
        global.msg = 1;
        if (id) {
            var myquery = {
                "_id": ObjectId(id)
            };
            var result_data = [];
            dbo.collection("Reminder").find(myquery).toArray(function(err, result) {
                result_data = result;
                result_data[0].id_d = ObjectId(result_data[0].role).toString();
                var query = {
                    "user_id": ObjectId(id)
                };
                var mydata = {
                    $and: [{
                        "module_name": "reminder"
                    }, {
                        "field_visibility": 1
                    }]
                };
                dbo.collection("customfields").find(mydata).toArray(function(err, customfield) {
                    for (const [key, value] of Object.entries(customfield)) {
                        customfield.forEach(element => {
                            customfield[key].id_d = ObjectId(value._id).toString();
                        });
                    };
                    var myquery1 = {
                        "reference_id": ObjectId(id)
                    };
                    dbo.collection("custom_field_meta").find(myquery1).toArray(function(err, customfield_value) {
                        for (const [key, value] of Object.entries(customfield_value)) {
                            customfield_value[key].id_d = ObjectId(value.custom_field_id).toString();
                        };
                        dbo.collection("notificationtemplate").find().toArray(function(err, notification_tem) {
                            res.render('reminder/addreminder', {
                                title: "Edit Reminder",
                                data: result_data,
                                id: id,
                                session: req.session,
                                setlang: languages,
                                newfield: customfield,
                                customfield_value: customfield_value,
                                notification_tem: notification_tem
                            });
                        });
                    });
                });

            });
        } else {
            var news = [{
                'reminderdata': {
                    '1': '1'
                }
            }];
            var mydata = {
                $and: [{
                    "module_name": "reminder"
                }, {
                    "field_visibility": 1
                }]
            };
            dbo.collection("customfields").find(mydata).toArray(function(err, customfield) {
                dbo.collection("notificationtemplate").find().toArray(function(err, notification_tem) {
                    res.render('reminder/addreminder', {
                        title: "Add Reminder",
                        data: news,
                        session: req.session,
                        newfield: customfield,
                        notification_tem: notification_tem
                    });
                });
            });
        }
    })
    // FOR FORM UPDATE AND ADD
    .post(upload.any(), isAuthenticated, function(req, res) {
        var id = req.body.id;
        var data = [];
        req.body.reminderdata.forEach(element => {
            var this_news = {
                number: element.number,
                recurense: element.recurense,
            }
            data.push(this_news);
        });
        if (id) {
            var myquery = {
                "_id": ObjectId(id)
            };
            var dbo = db.get();
            var newvalues = {
                $set: {
                    reminder_nm: req.body.reminder_nm,
                    reminder_template: req.body.reminder_template,
                    reminder_desc: req.body.reminder_desc,
                    reminder_will_send: req.body.reminder_will_send,
                    reminder_type: req.body.reminder_type,
                    reminderdata: data,
                }
            };
            dbo.collection("Reminder").updateOne(myquery, newvalues, function(err, result) {
                var date = Date(Date.now());
                var formatdate = moment(date).format("YYYY-MM-DD");
                var myobj = {
                    date: formatdate,
                    module: "Reminder",
                    action: "updated",
                    user: ObjectId(req.session.user_id),
                    item: req.body.reminder_nm,
                    status: 0,
                };
                dbo.collection("activitylog").insertOne(myobj, function(err, activity) {});
                var query = {
                    "reference_id": ObjectId(id)
                };
                dbo.collection("custom_field_meta").find(query).toArray(function(err, metadata) {
                    if (metadata != "") {
                        var date = Date(Date.now());
                        var formatdate = moment(date).format("YYYY-MM-DD");
                        if (req.body.customfields) {
                            for (const [keys, values] of Object.entries(metadata)) {
                                var findquery = {
                                    "_id": values.custom_field_id
                                };
                                dbo.collection("customfields").find(findquery).toArray(function(err, finddata) {
                                    for (const [keysdata, valuesdata] of Object.entries(finddata)) {
                                        if (valuesdata.field_type == 'file') {
                                            for (const [key, value] of Object.entries(req.files)) {
                                                var field = ObjectId(values.custom_field_id).toString();
                                                if (value.fieldname == field) {
                                                    var query1 = {
                                                        "_id": values._id
                                                    };
                                                    dbo.collection("custom_field_meta").remove(query1, function(err, deletealldata) {
                                                        if (err) throw err;
                                                    });
                                                }
                                            }
                                        } else {
                                            var query1 = {
                                                "_id": values._id
                                            };
                                            dbo.collection("custom_field_meta").remove(query1, function(err, deletealldata) {
                                                if (err) throw err;
                                            });
                                        }
                                    }
                                });
                            }
                            for (const [keys1, values1] of Object.entries(req.body.customfields)) {
                                var this_data = {
                                    custom_field_id: ObjectId(keys1),
                                    customfield_value: values1,
                                    module: "reminder",
                                    user_id: ObjectId(req.session.user_id),
                                    reference_id: ObjectId(id),
                                    updated_at: formatdate,
                                }
                                dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                            }
                        }
                        var m = 0;
                        for (const [key, value] of Object.entries(req.files)) {
                            for (const [keys, values] of Object.entries(metadata)) {
                                var query1 = {
                                    "_id": values._id
                                };
                                var field = ObjectId(values.custom_field_id).toString();
                                if (value.fieldname == field) {} else {
                                    if (values._id) {
                                        m++;
                                    }
                                }
                            }
                            if (m > 0) {
                                var this_data = {
                                    custom_field_id: ObjectId(value.fieldname),
                                    customfield_value: value.filename,
                                    module: "reminder",
                                    user_id: ObjectId(req.session.user_id),
                                    reference_id: ObjectId(id),
                                    updated_at: formatdate,
                                }
                                dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                            }
                        }
                    } else {
                        var date = Date(Date.now());
                        var formatdate = moment(date).format("YYYY-MM-DD");
                        if (req.body.customfields) {
                            for (const [key, value] of Object.entries(req.body.customfields)) {
                                var this_data = {
                                    custom_field_id: ObjectId(key),
                                    customfield_value: value,
                                    module: "reminder",
                                    user_id: ObjectId(req.session.user_id),
                                    reference_id: ObjectId(req.body.id),
                                    updated_at: formatdate,
                                }
                                dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                            }
                        }
                        if (req.files) {
                            for (const [key, value] of Object.entries(req.files)) {
                                var this_data = {
                                    custom_field_id: ObjectId(value.fieldname),
                                    customfield_value: value.filename,
                                    module: "reminder",
                                    user_id: ObjectId(req.session.user_id),
                                    reference_id: resultes.insertedId,
                                    updated_at: formatdate,
                                }
                                dbo.collection("custom_field_meta").insertOne(this_data, function(err, result5) {});
                            }
                        }
                    }
                    // if (err) throw err;
                    if (err) {
                        req.flash('error', lang.__('Error occured.'));
                        res.redirect('/reminder/reminders');
                    } else {
                        req.flash('success', lang.__('Reminder Updated Sucessfully.'));
                        res.redirect('/reminder/reminders');
                    }
                });
            });
        } else {
            var dbo = db.get();
            var myobj = {
                reminder_nm: req.body.reminder_nm,
                reminder_template: req.body.reminder_template,
                reminder_desc: req.body.reminder_desc,
                reminder_will_send: req.body.reminder_will_send,
                reminder_type: req.body.reminder_type,
                reminderdata: data,
            };
            dbo.collection("Reminder").insertOne(myobj, function(err, result) {
                var date = Date(Date.now());
                var formatdate = moment(date).format("YYYY-MM-DD");
                var myobj = {
                    date: formatdate,
                    module: "Reminder",
                    action: "inserted",
                    user: ObjectId(req.session.user_id),
                    item: req.body.reminder_nm,
                    status: 0,
                };
                dbo.collection("activitylog").insertOne(myobj, function(err, activity) {});
                if (req.body.customfields) {
                    for (const [key, value] of Object.entries(req.body.customfields)) {
                        var this_data = {
                            custom_field_id: ObjectId(key),
                            customfield_value: value,
                            module: "role",
                            user_id: ObjectId(req.session.user_id),
                            reference_id: result.insertedId,
                            updated_at: formatdate,
                        }
                        dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                    }
                }
                if (req.files) {
                    for (const [key, value] of Object.entries(req.files)) {
                        var this_data = {
                            custom_field_id: ObjectId(value.fieldname),
                            customfield_value: value.filename,
                            module: "reminder",
                            user_id: ObjectId(req.session.user_id),
                            reference_id: result.insertedId,
                            updated_at: formatdate,
                        }
                        dbo.collection("custom_field_meta").insertOne(this_data, function(err, result5) {});
                    }
                }
                if (err) {
                    req.flash('error', lang.__('Error occured.'));
                    res.redirect('/reminder/reminders');
                } else {
                    req.flash('success', lang.__('Reminder Inserted Sucessfully.'));
                    res.redirect('/reminder/reminders');
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
                        if (result[0].access_type.reminder != undefined) {
                            if (result[0].access_type.reminder.add != undefined) {
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
                        if (result[0].access_type.reminder != undefined) {
                            if (result[0].access_type.reminder.update != undefined) {
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