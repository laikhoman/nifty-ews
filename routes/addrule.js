'use strict';
var express = require('express');
var router = express.Router();
var http = require('http');
var db = require('./mongo_db');
var ObjectId = require('mongodb').ObjectId;
var lang = require('./languageconfig');
var moment = require('moment');
router.use(lang.init);
var bodyParser = require('body-parser');
var flash = require('express-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');

// FOR IMAGE SAVE
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
// IMAGE SAVE END


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
            dbo.collection("Rule").find(myquery).toArray(function(err, result) {
                dbo.collection("Generalsetting").find().toArray(function(err, geninfo) {

                    var mydata = {
                        $and: [{
                            "module_name": "rule"
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
                            res.render('rule/addrule', {
                                title: "Edit Rule",
                                data: result,
                                id: id,
                                session: req.session,
                                geninfo: geninfo,
                                newfield: customfield,
                                customfield_value: customfield_value
                            });
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
                    "module_name": "rule"
                }, {
                    "field_visibility": 1
                }]
            };
            dbo.collection("customfields").find(mydata).toArray(function(err, customfield) {
                res.render('rule/addrule', {
                    title: "Add Rule",
                    data: news,
                    session: req.session,
                    newfield: customfield
                });
            });
        }
    })
    .post(upload.single('rule_image'), isAuthenticated, function(req, res) {
        var id = req.body.id;

        if (id) {

            var myquery = {
                "_id": ObjectId(id)
            };
            var dbo = db.get();
            if (req.file != undefined) {
                var rule_image = req.file.filename;
            } else {
                var rule_image = req.body.rule_photo_old;
            }
            var newvalues = {
                $set: {
                    loantype: req.body.loantype,
                    rule_title: req.body.rule_title,
                    rule_desc: req.body.rule_desc,
                    loan_amount_rule: req.body.loan_amount_rule,
                    rule_image: rule_image,
                }
            };
            dbo.collection("Rule").updateOne(myquery, newvalues, function(err, result) {
                var date = Date(Date.now());
                var formatdate = moment(date).format("YYYY-MM-DD");
                var myobj = {
                    date: formatdate,
                    module: "Rule",
                    action: "inserted",
                    user: ObjectId(req.session.user_id),
                    item: req.body.loantype,
                    status: 0,
                };
                dbo.collection("activitylog").insertOne(myobj, function(err, result) {});
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
                                                if (value.fieldname == "rule_image") {} else {
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
                                    module: "rule",
                                    user_id: ObjectId(req.session.user_id),
                                    reference_id: ObjectId(id),
                                    updated_at: formatdate,
                                };
                                dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                            }
                        }
                        var m = 0;
                        for (const [key, value] of Object.entries(req.files)) {
                            if (value.fieldname == "rule_image") {} else {
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
                                        module: "rule",
                                        user_id: ObjectId(req.session.user_id),
                                        reference_id: ObjectId(id),
                                        updated_at: formatdate,
                                    };
                                    dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                                }
                            }
                        }
                    } else {
                        if (req.body.customfields) {
                            for (const [key, value] of Object.entries(req.body.customfields)) {
                                var this_data = {
                                    custom_field_id: ObjectId(key),
                                    customfield_value: value,
                                    module: "rule",
                                    user_id: ObjectId(req.session.user_id),
                                    reference_id: ObjectId(id),
                                    updated_at: formatdate,
                                };
                                dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                            }
                        }
                        if (req.files) {
                            for (const [key, value] of Object.entries(req.files)) {
                                if (value.fieldname == "rule_image") {

                                } else {
                                    var this_data = {
                                        custom_field_id: ObjectId(value.fieldname),
                                        customfield_value: value.filename,
                                        module: "rule",
                                        user_id: ObjectId(req.session.user_id),
                                        reference_id: ObjectId(id),
                                        updated_at: formatdate,
                                    }
                                    dbo.collection("custom_field_meta").insertOne(this_data, function(err, result5) {});
                                }
                            }
                        }
                    }
                    if (err) throw err;
                });

                if (err) {
                    req.flash('error', 'Error occured.');
                    res.redirect('/rule/rules');
                } else {
                    req.flash('success', lang.__('Rules Updated Sucessfully.'));
                    res.redirect('/rule/rules');
                }
            });

        } else {

            var dbo = db.get();
            var rule_image1 = "";
            if (req.file != undefined) {
                var rule_image1 = req.file.filename;
            } else {
                var rule_image1 = req.body.rule_photo_old;
            }
            var myobj = {
                loantype: req.body.loantype,
                rule_title: req.body.rule_title,
                rule_desc: req.body.rule_desc,
                rule_image: rule_image1,
                loan_amount_rule: req.body.loan_amount_rule,
            };
            dbo.collection("Rule").insertOne(myobj, function(err, result) {
                var date = Date(Date.now());
                var formatdate = moment(date).format("YYYY-MM-DD");
                var myobj = {
                    date: formatdate,
                    module: "Rule",
                    action: "inserted",
                    user: ObjectId(req.session.user_id),
                    item: req.body.loantype,
                    status: 0,
                };
                dbo.collection("activitylog").insertOne(myobj, function(err, result) {});
                if (req.body.customfields) {
                    for (const [key, value] of Object.entries(req.body.customfields)) {
                        var this_data = {
                            custom_field_id: ObjectId(key),
                            customfield_value: value,
                            module: "rule",
                            user_id: ObjectId(req.session.user_id),
                            reference_id: result.insertedId,
                            updated_at: formatdate,
                        }
                        dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                    }
                }
                if (req.files) {
                    for (const [key, value] of Object.entries(req.files)) {
                        if (value.fieldname == "rule_image") {

                        } else {
                            var this_data = {
                                custom_field_id: ObjectId(value.fieldname),
                                customfield_value: value.filename,
                                module: "rule",
                                user_id: ObjectId(req.session.user_id),
                                reference_id: result.insertedId,
                                updated_at: formatdate,
                            }
                            dbo.collection("custom_field_meta").insertOne(this_data, function(err, result5) {});
                        }
                    }
                }
                if (err) {
                    req.flash('error', 'Error occured.');
                    res.redirect('/rule/rules');
                } else {
                    req.flash('success', lang.__('Rule Inserted Sucessfully.'));
                    res.redirect('/rule/rules');
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
                        if (result[0].access_type.rulesandregulation != undefined) {
                            if (result[0].access_type.rulesandregulation.add != undefined) {
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
                        if (result[0].access_type.rulesandregulation != undefined) {
                            if (result[0].access_type.rulesandregulation.update != undefined) {
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