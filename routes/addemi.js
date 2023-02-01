'use strict';
var express = require('express');
var router = express.Router();
var session = require('express-session');
var http = require('http');
var db = require('./mongo_db');
var ObjectId = require('mongodb').ObjectId;
var lang = require('./languageconfig');
var dateFormat = require('dateformat');
var moment = require('moment');
var bodyParser = require('body-parser');
router.use(lang.init);

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

/* GET home page. */
router.route('/:id?')
    .get(isAuthenticated, function(req, res) {
        var time = dateFormat("Jun 9 2007", "fullDate");
        var dbo = db.get();
        var id = req.params.id;
        if (id) {
            var myquery = {
                "_id": ObjectId(id)
            };
            var result_data = [];
            dbo.collection("emi_details").find(myquery).toArray(function(err, result) {
                if (err) throw err;
                result_data = result;
                var loanid = {
                    "_id": result[0].loan_id
                };
                if (err) throw err;
                dbo.collection("loan_details").find(loanid).toArray(function(err, loanlist) {
                    var type = {
                        "_id": loanlist[0].loantype
                    };
                    dbo.collection("loantype").find(type).toArray(function(err, typeofloan) {
                        var mydata = {
                            $and: [{
                                "module_name": "emi"
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

                                res.render('loan/addemi', {
                                    title: "Add EMI",
                                    loan: loanlist,
                                    data: result_data,
                                    type: typeofloan,
                                    id: id,
                                    session: req.session,
                                    newfield: customfield,
                                    customfield_value: customfield_value
                                });
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
                    "module_name": "emi"
                }, {
                    "field_visibility": 1
                }]
            };
            dbo.collection("customfields").find(mydata).toArray(function(err, customfield) {
                res.render('loan/addemi', {
                    title: "Add EMI",
                    data: news,
                    family: news,
                    session: req.session,
                    newfield: customfield
                });
            });
        }
    })
    .post(upload.any(), isAuthenticated, function(req, res) {
        var dbo = db.get("BankingSystem");
        var id = req.body.id;
        var myquery = {
            "_id": ObjectId(id)
        };
        if (id) {
            var newvalues = {
                $set: {
                    payment_type: req.body.payment_type,
                    cheque_name: req.body.cheque_name,
                    cheque_accountno: req.body.cheque_accountno,
                    cheque_date: req.body.cheque_date,
                    paymentamount: req.body.paymentamount,
                    status: 1,
                }
            };
            dbo.collection("emi_details").updateOne(myquery, newvalues, function(err, result) {
                var date = Date(Date.now());
                var formatdate = moment(date).format("YYYY-MM-DD");
                var myobj = {
                    date: formatdate,
                    module: "EMI",
                    action: "updated EMI",
                    user: ObjectId(req.session.user_id),
                    item: req.body.loancount,
                    status: 0,
                };
                dbo.collection("activitylog").insertOne(myobj, function(err, activity) {});
                if (req.body.customfields) {
                    for (const [key, value] of Object.entries(req.body.customfields)) {
                        var this_data = {
                            custom_field_id: ObjectId(key),
                            customfield_value: value,
                            module: "emi",
                            user_id: ObjectId(req.session.user_id),
                            reference_id: result.insertedId,
                            updated_at: formatdate,
                        }
                        dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                    }
                }
                if (req.files) {
                    for (const [key, value] of Object.entries(req.files)) {
                        for (const [key1, value1] of Object.entries(req.files)) {
                            var this_data = {
                                custom_field_id: ObjectId(value.fieldname),
                                customfield_value: value.filename,
                                module: "emi",
                                user_id: ObjectId(req.session.user_id),
                                reference_id: result.insertedId,
                                updated_at: formatdate,
                            }
                        }
                        dbo.collection("custom_field_meta").insertOne(this_data, function(err, result2) {});
                    }
                }
                if (err) {
                    req.flash('error', 'Error occured.');
                    res.redirect('/loan/loanlist');
                } else {
                    req.flash('success', 'Emi paid Sucessfully.');
                    res.redirect('/loan/loanlist');
                }
            });
        }
    });

function isAuthenticated(req, res, next) {
    if (req.session.username != undefined) {
        return next();
    } else {
        res.redirect('/');
    }
};

module.exports = router;