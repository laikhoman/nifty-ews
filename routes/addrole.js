'use strict';
var express = require('express');
var router = express.Router();
var http = require('http');
var db = require('./mongo_db');
var ObjectId = require('mongodb').ObjectId;
var Mail = require('./email');
var flash = require('express-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var lang = require('./languageconfig');
var moment = require('moment');

var bodyParser = require('body-parser');
// FOR IMAGE SAVE
var multer = require('multer');
var app = express();
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
// IMAGE SAVE END

router.use(lang.init);
router.use(cookieParser());
router.use(session({
    secret: '222222'
}));
router.use(flash());

router.route('/:id?')
    .get(isAuthenticated, function(req, res) {
        var dbo = db.get();
        var id = req.params.id;
        if (id) {
            var myquery = {
                "_id": ObjectId(id)
            };
            dbo.collection("Role").find(myquery).toArray(function(err, result) {
                var mydata = {
                    $and: [{
                        "module_name": "role"
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
                        res.render('role/addrole', {
                            title: "Edit Role",
                            data: result,
                            id: id,
                            session: req.session,
                            newfield: customfield,
                            customfield_value: customfield_value
                        });
                    });
                });
            });
        } else {
            var news = [{
                'userid': '-1'
            }];
            var mydata = {
                $and: [{
                    "module_name": "role"
                }, {
                    "field_visibility": 1
                }]
            };
            dbo.collection("customfields").find(mydata).toArray(function(err, customfield) {
                res.render('role/addrole', {
                    title: "Add Role",
                    data: news,
                    session: req.session,
                    newfield: customfield
                });
            });
        }
    })
    .post(upload.any(), isAuthenticated, function(req, res) {
        var id = req.body.id;
        var name1 = req.body.admin_access;
        var name2 = req.body.allow_access;
        if (name1 == 'on') {

            var value1 = "1";

        } else {
            var value1 = "0";

        }

        if (name2 == 'on') {

            var value2 = "1";

        } else {
            var value2 = "0";

        }
        if (id) {
            var myquery = {
                "_id": ObjectId(id)
            };
            var dbo = db.get();

            var newvalues = {
                $set: {
                    role_nm: req.body.role_nm,
                    role_slug: req.body.role_slug,
                    role_desc: req.body.role_desc,
                    admin_access: parseInt(value1),
                    allow_access: parseInt(value2),
                    status: 0,
                }
            };
            dbo.collection("Role").updateOne(myquery, newvalues, function(err, result) {
                var date = Date(Date.now());
                var formatdate = moment(date).format("YYYY-MM-DD");
                var myobj = {
                    date: formatdate,
                    module: "Role",
                    action: "updated role",
                    user: ObjectId(req.session.user_id),
                    item: req.body.role_nm,
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
                                    module: "role",
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
                                    module: "role",
                                    user_id: ObjectId(req.session.user_id),
                                    reference_id: ObjectId(id),
                                    updated_at: formatdate,
                                };
                                dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                            }
                        }
                    } else {
                        if (req.body.customfields) {
                            for (const [key, value] of Object.entries(req.body.customfields)) {
                                var this_data = {
                                    custom_field_id: ObjectId(key),
                                    customfield_value: value,
                                    module: "role",
                                    user_id: ObjectId(req.session.user_id),
                                    reference_id: ObjectId(id),
                                    updated_at: formatdate,
                                };
                                dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                            }
                        }
                        if (req.files) {
                            for (const [key, value] of Object.entries(req.files)) {
                                var this_data = {
                                    custom_field_id: ObjectId(value.fieldname),
                                    customfield_value: value.filename,
                                    module: "role",
                                    user_id: ObjectId(req.session.user_id),
                                    reference_id: ObjectId(id),
                                    updated_at: formatdate,
                                };
                                dbo.collection("custom_field_meta").insertOne(this_data, function(err, result5) {});
                            }
                        }
                    }
                    if (err) {
                        req.flash('error', lang.__('Error occured.'));
                        res.redirect('/role/roles');
                    } else {
                        req.flash('success', lang.__('Role Updated Sucessfully.'));
                        res.redirect('/role/roles');
                    }
                });
            });

        } else {

            var dbo = db.get();
            var myobj = {
                role_nm: req.body.role_nm,
                role_slug: req.body.role_slug,
                role_desc: req.body.role_desc,
                admin_access: parseInt(value1),
                allow_access: parseInt(value2),
                status: 0,
            };
            dbo.collection("Role").insertOne(myobj, function(err, result) {
                var date = Date(Date.now());
                var formatdate = moment(date).format("YYYY-MM-DD");
                var myobj = {
                    date: formatdate,
                    module: "Role",
                    action: "inserted role",
                    user: ObjectId(req.session.user_id),
                    item: req.body.role_nm,
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
                        };
                        dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                    }
                }
                if (req.files) {
                    for (const [key, value] of Object.entries(req.files)) {
                        var this_data = {
                            custom_field_id: ObjectId(value.fieldname),
                            customfield_value: value.filename,
                            module: "role",
                            user_id: ObjectId(req.session.user_id),
                            reference_id: result.insertedId,
                            updated_at: formatdate,
                        };
                        dbo.collection("custom_field_meta").insertOne(this_data, function(err, result5) {});
                    }
                }
                if (err) {
                    req.flash('error', lang.__('Error occured.'));
                    res.redirect('/role/roles');
                } else {
                    req.flash('success', lang.__('Role Inserted Sucessfully.'));
                    res.redirect('/role/roles');
                }
            });
            // res.redirect('/role/roles');
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
                        if (result[0].access_type.role != undefined) {
                            if (result[0].access_type.role.add != undefined) {
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
                        if (result[0].access_type.role != undefined) {
                            if (result[0].access_type.role.update != undefined) {
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