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
        var languages = lang.getLocale();
        var dbo = db.get();
        var id = req.params.id;
        if (id) {
            var myquery = {
                "_id": ObjectId(id)
            };
            var notequery = {
                "module_id": ObjectId(id)
            };
            var query = {
                "categorytypes": "product"
            };
            var unit_query = {
                "categorytypes": "product_unit"
            };
            dbo.collection("category").find(query).toArray(function(err, category) {
                dbo.collection("category").find(unit_query).toArray(function(err, unitcategory) {
                    dbo.collection("notes").find(notequery).toArray(function(err, notes) {
                        dbo.collection("product").find(myquery).toArray(function(err, product) {
                            dbo.collection("Generalsetting").find().toArray(function(err, geninfo) {
                                var mydata = {
                                    $and: [{
                                        "module_name": "product"
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
                                        res.render('product/addproduct', {
                                            title: 'Edit Product',
                                            session: req.session,
                                            messages: req.flash(),
                                            category: category,
                                            unit: unitcategory,
                                            data: product,
                                            newfield: customfield,
                                            customfield_value: customfield_value,
                                            note: notes,
                                            setting: geninfo
                                        });
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
            var news = [{
                'userid': '-1'
            }];
            var query = {
                "categorytypes": "product"
            };
            var unit_query = {
                "categorytypes": "product_unit"
            };
            var mydata = {
                $and: [{
                    "module_name": "product"
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
                    dbo.collection("category").find(query).toArray(function(err, category) {
                        dbo.collection("category").find(unit_query).toArray(function(err, unitcategory) {
                            res.render('product/addproduct', {
                                title: "Add Product",
                                data: news,
                                session: req.session,
                                category: category,
                                unit: unitcategory,
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
        var productimg = [];
        var attachfiles = [];
        var upimg = req.body.productimage_old;
        if (upimg != undefined) {
            if (Array.isArray(upimg)) {
                var productimg = req.body.productimage_old;
            } else {
                productimg.push(upimg);
            }
        }
        for (const [keys, values] of Object.entries(req.files)) {
            if (values.fieldname == "productimage") {
                var img = values.filename;
                productimg.push(img);
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
                i++;
            }
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
            var dbo = db.get();
            var newvalues = {
                $set: {
                    productname: req.body.productname,
                    categorytypes: req.body.categorytypes,
                    productunit: req.body.productunit,
                    description: req.body.description,
                    productimage: productimg,
                    warranty: req.body.warranty,
                    dur_type: req.body.dur_type,
                    tagname: tag,
                    skubarcode: req.body.skubarcode,
                    initialstock: req.body.initialstock,
                    stockexpiry: req.body.stockexpiry,
                    locationrack: req.body.locationrack,
                    retailprice: req.body.retailprice,
                    specialprice: req.body.specialprice,
                    supplyprice: req.body.supplyprice,
                    commission: req.body.commission,
                }
            };
            dbo.collection("product").updateOne(myquery, newvalues, function(err, result) {
                var date = Date(Date.now());
                var formatdate = moment(date).format("YYYY-MM-DD");
                var myobjs = {
                    date: formatdate,
                    module: "Product",
                    action: "updated product",
                    user: ObjectId(req.session.user_id),
                    item: req.body.productname,
                    status: 0,
                };
                dbo.collection("activitylog").insertOne(myobjs, function(err, activity) {});
                var notequery = {
                    "module": "product"
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
                                                module: "product",
                                                module_id: ObjectId(id),
                                            }
                                        };
                                        dbo.collection("notes").updateOne(nquery, this_data, function(err, notefile) {});
                                    }
                                }
                            }
                        }
                    }
                });
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
                                                if (value.fieldname == "productimage" || value.fieldname == "attachfile") {} else {
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
                                    module: "product",
                                    user_id: ObjectId(req.session.user_id),
                                    reference_id: ObjectId(id),
                                    updated_at: formatdate,
                                };
                                dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                            }
                        }
                        var m = 0;
                        for (const [key, value] of Object.entries(req.files)) {
                            if (value.fieldname == "productimage" || value.fieldname == "attachfile") {} else {
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
                                        module: "product",
                                        user_id: ObjectId(req.session.user_id),
                                        reference_id: ObjectId(id),
                                        updated_at: formatdate,
                                    };
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
                                    module: "product",
                                    user_id: ObjectId(req.session.user_id),
                                    reference_id: ObjectId(id),
                                    updated_at: formatdate,
                                };
                                dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                            }
                        }
                        if (req.files) {
                            for (const [key, value] of Object.entries(req.files)) {
                                if (value.fieldname == "productimage" || value.fieldname == "attachfile") {} else {
                                    var this_data = {
                                        custom_field_id: ObjectId(value.fieldname),
                                        customfield_value: value.filename,
                                        module: "product",
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
                        res.redirect('/product/productlist');
                    } else {
                        req.flash('success', lang.__('Product Updated Sucessfully.'));
                        res.redirect('/product/productlist');
                    }
                });
            });
        } else {
            var dbo = db.get();
            var myobj = {
                productname: req.body.productname,
                categorytypes: req.body.categorytypes,
                productunit: req.body.productunit,
                description: req.body.description,
                productimage: productimg,
                warranty: req.body.warranty,
                dur_type: req.body.dur_type,
                tagname: tag,
                skubarcode: req.body.skubarcode,
                supplier: req.body.supplier,
                initialstock: req.body.initialstock,
                stockexpiry: req.body.stockexpiry,
                locationrack: req.body.locationrack,
                retailprice: req.body.retailprice,
                specialprice: req.body.specialprice,
                supplyprice: req.body.supplyprice,
                commission: req.body.commission,
            };
            dbo.collection("product").insertOne(myobj, function(err, result) {
                var date = Date(Date.now());
                var formatdate = moment(date).format("YYYY-MM-DD");
                var myobj = {
                    date: formatdate,
                    module: "Product",
                    action: "inserted product",
                    user: ObjectId(req.session.user_id),
                    item: req.body.productname,
                    status: 0,
                };
                dbo.collection("activitylog").insertOne(myobj, function(err, activity) {});
                if (req.files) {
                    for (const [key, value] of Object.entries(req.files)) {
                        if (req.body.note || value.fieldname == "attachfile") {
                            var this_data = {
                                note: addnote,
                                fileattach: attachfiles,
                                module: "product",
                                module_id: ObjectId(result.insertedId),
                            };
                            dbo.collection("notes").insertOne(this_data, function(err, notefile) {});
                        }
                    }
                }
                if (req.body.customfields) {
                    for (const [key, value] of Object.entries(req.body.customfields)) {
                        var this_data = {
                            custom_field_id: ObjectId(key),
                            customfield_value: value,
                            module: "product",
                            user_id: ObjectId(req.session.user_id),
                            reference_id: result.insertedId,
                            updated_at: formatdate,
                        };
                        dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                    }
                }
                if (req.files) {
                    for (const [key, value] of Object.entries(req.files)) {
                        if (value.fieldname == "productimage" || value.fieldname == "attachfile") {} else {
                            var this_data = {
                                custom_field_id: ObjectId(value.fieldname),
                                customfield_value: value.filename,
                                module: "product",
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
                    res.redirect('/product/productlist');
                } else {
                    req.flash('success', lang.__('Product Inserted Sucessfully.'));
                    res.redirect('/product/productlist');
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
                        if (result[0].access_type.product != undefined) {
                            if (result[0].access_type.product.add != undefined) {
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
                        if (result[0].access_type.product != undefined) {
                            if (result[0].access_type.product.update != undefined) {
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