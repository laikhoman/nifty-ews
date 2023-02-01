'use strict';
var express = require('express');
var router = express.Router();
var db = require('./mongo_db');
var ObjectId = require('mongodb').ObjectId;
var flash = require('express-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var lang = require('./languageconfig');
var person = require('../helpers/function');
var Mail = require('./email');
var moment = require('moment');
router.use(cookieParser());
router.use(session({
    secret: '222222'
}));
router.use(flash());
router.use(lang.init);


/* GET home page. */
router.get('/', isAuthenticated, function(req, res, next) {
	
	 var dbo = db.get();
	// Notification for EMI
        var notificationtype = 'upcoming_emi';
		var alert_data=[];
		if(req.session.access_rights.reminder.owndata){
			var emi_query = {
								status: 0,
								user_id: ObjectId(req.session.user_id),
							}
			}
		else{
			var emi_query = {
								status: 0,
							}
		}
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
                        $and: [emi_query]
                    }
                }]).toArray(function(err, result1) {
                    if (err) throw err;

                    for (const [key1, value1] of Object.entries(result1)) {
                        if (value1.loan.approvestatus == 1 || value1.loan.status == 0) {
                            var date_of_emi = value1.date;

                            if (add_date === date_of_emi) {
								alert_data.push(value1);
                                
                            }

                        }
                    }
					res.render('reminder/reminders_customer', {
						title: 'Reminders',
						session: req.session,
						messages: req.flash(),
						alert_data:alert_data,
					});
					
                });
				
            });
        
		console.log(alert_data);
	
	
});
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
                if (result[0].access_type != undefined) {
                    if (result[0].access_type.reminder != undefined) {
                        if (result[0].access_type.reminder.view != undefined) {
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