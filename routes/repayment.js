'use strict';
var express = require('express');
var router = express.Router();
var session = require('express-session');
var http = require('http');
var db = require('./mongo_db');
var ObjectId = require('mongodb').ObjectId;
var lang = require('./languageconfig');
var dateFormat = require('dateformat');

router.use(lang.init);
/* GET home page. */
router.route('/:id?')
    .get(isAuthenticated, function(req, res) {
        var time = dateFormat("Jun 9 2007", "fullDate");
        var dbo = db.get();
        var id = req.params.id;
        var myquery = {
            "_id": ObjectId(id)
        };
        var result_data = [];
        dbo.collection("Re_Payments").find(myquery).toArray(function(err, result) {
            if (err) throw err;
            result_data = result;
            // dbo.collection("loan_details").find().toArray(function(err, loanlist) {
            res.render('loan/repayment', {
                title: "Add Re-Payments",
                data: result_data,
                id: id,
                session: req.session
            });
            // });	 
        });
    })
    .post(isAuthenticated, function(req, res) {
        var dbo = db.get("BankingSystem");
        var id = req.body.id;
        var myquery = {
            "_id": ObjectId(id)
        };
        var newvalues = {
            // paymentemimonth:req.body.paymentemimonth,  
            payment_type: req.body.payment_type,
            repayments: req.body.repayments,
            repaymentamount: req.body.repaymentamount,
            cheque_name: req.body.cheque_name,
            cheque_accountno: req.body.cheque_accountno,
            cheque_date: req.body.cheque_date,
            date: req.body.date,
        };
        dbo.collection("Re_Payments").insertOne(newvalues, function(err, result) {
            if (err) {
                req.flash('error', 'Error occured.');
                res.redirect('/loan/loanlist');
            } else {
                req.flash('success', 'Extra Re_payments Sucessfully.');
                res.redirect('/loan/loanlist');
            }
        });
    });

function isAuthenticated(req, res, next) {
    if (req.session.username != undefined) {
        return next();
    } else {
        res.redirect('/');
    }
};

module.exports = router;