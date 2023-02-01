'use strict';
var express = require('express');
var router = express.Router();
var db = require('./mongo_db');
var ObjectId = require('mongodb').ObjectId;
var lang = require('./languageconfig');
var flash = require('express-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var moment = require('moment');

router.use(lang.init);
router.use(cookieParser());
router.use(session({
    secret: '222222'
}));
router.use(flash());

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

router.route('/:id?')
    .get(isAuthenticated, function(req, res) {
        var languages = lang.getLocale();
        var dbo = db.get();
        var id = req.params.id;
        if (id) {
            var myquery = {
                "_id": ObjectId(id)
            };
            var query = {
                "categorytypes": "service"
            };
            var notequery = {
                "module_id": ObjectId(id)
            };
            var staffquery = {
                "role": ObjectId("5d5ce97225a26b1fb45236ba")
            };
            dbo.collection("service").find(myquery).toArray(function(err, service) {
                dbo.collection("category").find(query).toArray(function(err, result) {
                    dbo.collection("notes").find(notequery).toArray(function(err, notes) {
                        dbo.collection("Users").find(staffquery).toArray(function(err, staff) {
                            for (const [key, value] of Object.entries(staff)) {
                                staff.forEach(element => {
                                    staff[key].id_d = ObjectId(value._id).toString();
                                });
                            };
                            var mydata = {
                                $and: [{
                                    "module_name": "service"
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
                                    res.render('service/addservice', {
                                        title: 'Edit Service',
                                        session: req.session,
                                        messages: req.flash(),
                                        category: result,
                                        staff: staff,
                                        data: service,
                                        newfield: customfield,
                                        customfield_value: customfield_value,
                                        note: notes
                                    });
                                });
                            });
                        });
                    });
                });
            });
        } else {
            var myquery = {
                "_id": ObjectId(id)
            };
            var query = {
                "categorytypes": "service"
            };
            var staffquery = {
                "role": ObjectId("5d5ce97225a26b1fb45236ba")
            };
            var news = [{
                'userid': '-1'
            }];
            dbo.collection("category").find(query).toArray(function(err, result) {
                dbo.collection("Users").find(staffquery).toArray(function(err, staff) {
                    var mydata = {
                        $and: [{
                            "module_name": "service"
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
                            res.render('service/addservice', {
                                title: "Add Service",
                                data: news,
                                session: req.session,
                                category: result,
                                staff: staff,
                                newfield: customfield,
                                customfield_value: customfield_value,
                                note: news
                            });
                        });
                    });
                });
            });
        }
    })
    .post(upload.any(), isAuthenticated, function(req, res) {
        var id = req.body.id;
        var dbo = db.get();
        var i = 0;
        var j = 0;
        var uploadimg = [];
        var attachfiles = [];
        var upimg = req.body.image_old;
        if (upimg != undefined) {
            if (Array.isArray(upimg)) {
                uploadimg = req.body.image_old;
            } else {
                uploadimg.push(upimg);
            }
        }
        for (const [keys, values] of Object.entries(req.files)) {
            if (values.fieldname == "uploadimages") {
                var img = values.filename;
                uploadimg.push(img);
                i++;
            }
        }
        var atimg = req.body.attachfile_old;
        if (atimg != undefined) {
            if (Array.isArray(atimg)) {
                var attachfiles = req.body.attachfile_old;
            } else {
                attachfiles.push(atimg);
            }
        }
        for (const [keys, values] of Object.entries(req.files)) {
            if (values.fieldname == "attachfile") {
                var attach = values.filename;
                attachfiles.push(attach);
                j++;
            }
        }
        var staff = req.body.assigned_staff;
        var staffs = [];
        if (Array.isArray(staff)) {
            var staffs = req.body.assigned_staff;
        } else {
            staffs.push(staff);
        }
        var tags = req.body.tagname;
        var tag = [];
        if (Array.isArray(tags)) {
            var tag = req.body.tagname;
        } else {
            tag.push(tags);
        }
        //notes and attach file start
        var note = req.body.note;
        var addnote = [];
        if (Array.isArray(note)) {
            var addnote = req.body.note;
        } else {
            addnote.push(note);
        }
        //notes and attach file end
        if (id) {
            var myquery = {
                "_id": ObjectId(id)
            };
            var newvalues = {
                $set: {
                    servicename: req.body.servicename,
                    categorytypes: req.body.categorytypes,
                    servicefor: req.body.servicefor,
                    description: req.body.description,
                    uploadimages: uploadimg,
                    tagname: tag,
                    duration_hour: req.body.duration_hour,
                    duration_minute: req.body.duration_minute,
                    pricetype: req.body.pricetype,
                    price: req.body.price,
                    assigned_staff: staffs,
                    user_capacity: req.body.user_capacity,
                    enable_online_booking: req.body.enable_online_booking,
                }
            };
            dbo.collection("service").updateOne(myquery, newvalues, function(err, result) {
                var date = Date(Date.now());
                var formatdate = moment(date).format("YYYY-MM-DD");
                var myobj = {
                    date: formatdate,
                    module: "Service",
                    action: "updated service",
                    user: ObjectId(req.session.user_id),
                    item: req.body.servicename,
                    status: 0,
                };
                dbo.collection("activitylog").insertOne(myobj, function(err, activity) {});
                var notequery = {
                    "module": "service"
                };
                dbo.collection("notes").find(notequery).toArray(function(err, notedata) {
                    if (notedata != "") {
                        if (req.files) {
                            for (const [keys, values] of Object.entries(notedata)) {
                                var nquery = {
                                    "_id": values._id
                                };
                                for (const [key, value] of Object.entries(req.files)) {
                                    if (req.body.note || value.fieldname == "attachfile") {
                                        var this_data = {
                                            $set: {
                                                note: addnote,
                                                fileattach: attachfiles,
                                                module: "service",
                                                module_id: ObjectId(id),
                                            }
                                        }
                                        dbo.collection("notes").updateOne(nquery, this_data, function(err, notefile) {});
                                    }
                                }
                            }
                        }
                    }
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
                                                    if (value.fieldname == "uploadimages" || value.fieldname == "attachfile") {} else {
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
                                        module: "service",
                                        user_id: ObjectId(req.session.user_id),
                                        reference_id: ObjectId(id),
                                        updated_at: formatdate,
                                    }
                                    dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                                }
                            }
                            var m = 0;
                            for (const [key, value] of Object.entries(req.files)) {
                                if (value.fieldname == "uploadimages" || value.fieldname == "attachfile") {} else {
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
                                            module: "service",
                                            user_id: ObjectId(req.session.user_id),
                                            reference_id: ObjectId(id),
                                            updated_at: formatdate,
                                        }
                                        dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                                    }
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
                                        module: "service",
                                        user_id: ObjectId(req.session.user_id),
                                        reference_id: ObjectId(id),
                                        updated_at: formatdate,
                                    }
                                    dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                                }
                            }
                            if (req.files) {
                                for (const [key, value] of Object.entries(req.files)) {
                                    if (value.fieldname == "uploadimages" || value.fieldname == "attachfile") {} else {
                                        var this_data = {
                                            custom_field_id: ObjectId(value.fieldname),
                                            customfield_value: value.filename,
                                            module: "service",
                                            user_id: ObjectId(req.session.user_id),
                                            reference_id: ObjectId(id),
                                            updated_at: formatdate,
                                        }
                                        dbo.collection("custom_field_meta").insertOne(this_data, function(err, result5) {});
                                    }
                                }

                            }
                        }
                        if (err) {
                            req.flash('error', 'Error occured.');
                            res.redirect('/service/servicelist');
                        } else {
                            req.flash('success', lang.__('Service Updated Sucessfully.'));
                            res.redirect('/service/servicelist');
                        }
                    });
                });
            });
        } else {
            var dbo = db.get();
            var myobj = {
                servicename: req.body.servicename,
                categorytypes: req.body.categorytypes,
                servicefor: req.body.servicefor,
                description: req.body.description,
                uploadimages: uploadimg,
                tagname: tag,
                duration_hour: req.body.duration_hour,
                duration_minute: req.body.duration_minute,
                pricetype: req.body.pricetype,
                price: req.body.price,
                assigned_staff: staffs,
                user_capacity: req.body.user_capacity,
                enable_online_booking: req.body.enable_online_booking,
            };
            dbo.collection("service").insertOne(myobj, function(err, result) {
                var date = Date(Date.now());
                var formatdate = moment(date).format("YYYY-MM-DD");
                var myobj = {
                    date: formatdate,
                    module: "Service",
                    action: "inserted service",
                    user: ObjectId(req.session.user_id),
                    item: req.body.servicename,
                    status: 0,
                };
                dbo.collection("activitylog").insertOne(myobj, function(err, activity) {});
                if (req.body.customfields) {
                    for (const [key, value] of Object.entries(req.body.customfields)) {
                        var this_data = {
                            custom_field_id: ObjectId(key),
                            customfield_value: value,
                            module: "service",
                            user_id: ObjectId(req.session.user_id),
                            reference_id: result.insertedId,
                            updated_at: formatdate,
                        }
                        dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                    }
                }
                if (req.files) {
                    for (const [key, value] of Object.entries(req.files)) {
                        if (value.fieldname == "uploadimages" || value.fieldname == "attachfile") {} else {
                            var this_data = {
                                custom_field_id: ObjectId(value.fieldname),
                                customfield_value: value.filename,
                                module: "service",
                                user_id: ObjectId(req.session.user_id),
                                reference_id: result.insertedId,
                                updated_at: formatdate,
                            }
                            dbo.collection("custom_field_meta").insertOne(this_data, function(err, result5) {});
                        }
                    }

                }

                if (req.files && req.body.note) {
                    for (const [key, value] of Object.entries(req.files)) {
                        if (req.body.note || value.fieldname == "attachfile") {
                            var this_data = {
                                note: addnote,
                                fileattach: attachfiles,
                                module: "service",
                                module_id: result.insertedId,
                            }
                        }
                    }
                    dbo.collection("notes").insertOne(this_data, function(err, notefile) {});
                }
                if (err) {
                    req.flash('error', 'Error occured.');
                    res.redirect('/service/servicelist');
                } else {
                    req.flash('success', lang.__('Service Inserted Sucessfully.'));
                    res.redirect('/service/servicelist');
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
                        if (result[0].access_type.service != undefined) {
                            if (result[0].access_type.service.add != undefined) {
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
                        if (result[0].access_type.service != undefined) {
                            if (result[0].access_type.service.update != undefined) {
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