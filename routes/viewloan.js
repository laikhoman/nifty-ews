'use strict';
var express = require('express');
var router = express.Router();
var http = require('http');
var db = require('./mongo_db');
var ObjectId = require('mongodb').ObjectId;
var bodyParser = require('body-parser');
var fs = require('fs');
var LoanJS = require('loanjs');
var lang = require('./languageconfig');
var moment = require('moment');
router.use(lang.init);

/* GET users listing. */
router.route('/:id?')
    .get(isAuthenticated, function(req, res) {
        var dbo = db.get();
        var id = req.params.id;
        if (id) {
            var myquery = {
                "_id": ObjectId(id)
            };
            var result_data = [];
			
            dbo.collection("loan_details").find(myquery).toArray(function(err, result) {

                if (err) throw err;
                result_data = result;

                var loanquery = {
                    "_id": result[0].loantype
                };
                var query = {
                    "_id": result[0].user
                };

                var loanid = {
                    "loan_id": ObjectId(id)
                };
                dbo.collection("Users").find(query).toArray(function(err, result1) {
                    dbo.collection("loantype").find(loanquery).toArray(function(err, typeofloan) {
                        dbo.collection("Re_Payments").find().toArray(function(err, repayment) {
                            if (err) throw err;
                            dbo.collection("emi_details").find(loanid).toArray(function(err, emilist) {
                                
								// Alert for EMI
							/* var notificationtype = ['upcoming_emi', 'emi_pending'];
							for (const [key, value] of Object.entries(notificationtype)) { */
							var notificationtype = 'upcoming_emi';
							var alert_data=[];
								dbo.collection("Reminder").find({
									reminder_type: notificationtype
								}).limit(1).toArray(function(err, Reminder) {


									for (const [keys, values_n] of Object.entries(Reminder)) {

										var befor_after = values_n.reminder_will_send;
										var reminder_template = values_n.reminder_template;
										for (const [keys, values1] of Object.entries(values_n.reminderdata)) {
											var number_day = values1.number;
										}
									}
									var date = Date(Date.now());
									var Today_date = moment(date).format("YYYY-MM-DD");
									if (befor_after == "Before") {
										var add_date = moment(date).add(number_day, 'd');
									} else {
										var add_date = moment(date).subtract(number_day, 'd');
									}
									var add_date = moment(add_date).format("YYYY-MM-DD");
									console.log("++++++++++++++");
									console.log(add_date);
									dbo.collection("emi_details").aggregate([{
										$lookup: {
											from: "loan_details",
											localField: "loan_id",
											foreignField: "_id",
											as: "loan"
										}
									}, {
										$unwind: "$loan"
									}, {
										$lookup: {
											from: "Users",
											localField: "user_id",
											foreignField: "_id",
											as: "user"
										}
									}, {
										$unwind: "$user"
									}, {
										$match: {
											$and: [ {
												loan_id: ObjectId(id),
												status: 0,
												date: add_date,
												} ]
										}
									}]).toArray(function(err, result1) {
										if (err) throw err;

										for (const [key1, value1] of Object.entries(result1)) {
											if (value1.loan.approvestatus == 1 || value1.loan.status == 0) {
												alert_data.push(value1);
											}

										}
											console.log(result1);
											console.log(alert_data);
										res.render('loan/viewloan', {
											title: "View Loan",
											emi: emilist,
											type: typeofloan,
											repayment: repayment,
											data: result_data,
											user: result1,
											id: id,
											session: req.session,
											alert_data: alert_data
										});
									});
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
            res.render('loan/viewloan', {
                title: "View Loan",
                data: news,
                family: news,
                session: req.session
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
                    if (result[0].access_type.loanlist != undefined) {
                        if (result[0].access_type.loanlist.view != undefined) {
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