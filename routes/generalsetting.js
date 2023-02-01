'use strict';
var express = require('express');
var router = express.Router();
var http = require('http');
var db = require('./mongo_db');
var ObjectId = require('mongodb').ObjectId;
var bodyParser = require('body-parser');
var session = require('express-session');
var flash = require('express-flash');
var cookieParser = require('cookie-parser');
var fs = require('fs');
var lang = require('./languageconfig');
router.use(lang.init);
var path = require('path');

// FOR IMAGE SAVE
var multer = require('multer');
var app = express();
var jsonParsed = bodyParser.json();

// create application/x-www-form-urlencoded parser+
var urlencodedParser = bodyParser.urlencoded({
    extended: false
});
var storage = multer.diskStorage({

    // file upload destination
    destination: function(req, file, callback) {
        callback(null, 'public/images/upload/generalsetting');
    },
    filename: function(req, file, callback) {
        callback(null, Date.now() + '-' + file.originalname);
        var dbo = db.get();
        dbo.collection("Generalsetting").find().toArray(function(err, result) {

            //var jpg = result[0].imgtype_jpg;
            //var jpeg = result[0].imgtype_jpeg;
            //var png = result[0].imgtype_png;

            // uncomment where you validate .jpg or png.

            /*  if (!file.originalname.match((result[0].imgtype_png) | (result[0].imgtype_jpeg) | (result[0].imgtype_jpg)))
		{
			return callback(new Error('Only image files are allowed!'), false);
		}  */
        });
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
/* GET generalsetting page. */
router.route('/:id?')
    .get(isAuthenticated, function(req, res) {
        var languages = lang.getLocale();
        var dbo = db.get();
        var id = req.params.id;
        if (id) {
            var myquery = {
                "_id": ObjectId(id)
            };

            dbo.collection("Generalsetting").find(myquery).toArray(function(err, result) {

                fs.readFile('public/data/countries.json', function(err, data) {
                    var jsonData = data;
                    var jsonParsed_d = JSON.parse(jsonData);

                    dbo.collection("customfields").find().toArray(function(err, customfield) {

                        res.render('generalsettings/generalsetting', {
                            title: "General Settings",
                            data: result,
                            id: id,
                            session: req.session,
                            country: jsonParsed_d.countries,
                            messages: req.flash(),
                            setlang: languages,
                            newfield: customfield
                        });
                    });
                });
            });
        } else {
            var news = [{
                'userid': '-1'
            }];
            dbo.collection("customfields").find().toArray(function(err, customfield) {
                res.render('generalsettings/generalsetting', {
                    data: news,
                    session: req.session,
                    newfield: customfield
                });
            });
        }

    })


.post(upload.single('company_logo'), isAuthenticated, function(req, res) {
    var id1 = req.body.id;
    if (id1) {
        var updt_id = {
            "_id": ObjectId(id1)
        };
        var dbo = db.get();
        var company = req.body.companybtn;
        var loc = req.body.localization;
        var finance = req.body.finance;
        var invoice = req.body.invoice;
        var pdf_settings = req.body.pdf_settings;


        if (req.body.companybtn) {

            /* var jpg = req.body.imgtype_jpg;
			var jpeg = req.body.imgtype_jpeg;
			var png = req.body.imgtype_png;
			 */
            /* if (!req.file.originalname.match(/\.(jpg|jpeg|png)$/))
			{
			} */



            //var file_ext = path.extname(req.file.filename);

            /* 	var options = {
				validation: {
				  'allowedExts': ['png,jpg']
				}
			  } */

            if (req.file != undefined) {
                var logo = req.file.filename;

            } else {
                var logo = req.body.compan_old_images;
            }
            req.session.company_logo = logo;
            var newvalues = {
                $set: {
                    com_name: req.body.com_name,
                    com_email: req.body.com_email,
                    com_addr: req.body.com_addr,
                    company_logo: logo,
                    business_type: req.body.business_type,
                    country_code: req.body.country_code,
                    phone: req.body.phone,
                    footer_text: req.body.footer_text,
                    vat_no: req.body.vat_no,
                    gst_no: req.body.gst_no,
                    email_bcc: req.body.email_bcc,
                    zipcode: req.body.zipcode,
                    //imgtype_jpg: req.body.imgtype_jpg ? true : false,
                    //imgtype_png: req.body.imgtype_png ? true : false,
                    //imgtype_jpeg: req.body.imgtype_jpeg ? true : false,
                    imgtype_jpg: req.body.imgtype_jpg,
                    imgtype_png: req.body.imgtype_png,
                    imgtype_jpeg: req.body.imgtype_jpeg,
                    doctype: req.body.doctype,
                    imgupload_size: req.body.imgupload_size,
                    docupload_size: req.body.docupload_size,
                    country: parseInt(req.body.country, 10),
                    state: parseInt(req.body.state, 10),
                    city: parseInt(req.body.city, 10),
                    doctype_Pdf: req.body.doctype_Pdf,
                    doctype_Xlsx: req.body.doctype_Xlsx,
                    doctype_Xls: req.body.doctype_Xls,
                    doctype_Zip: req.body.doctype_Zip,
                    doctype_Doc: req.body.doctype_Doc,
                    doctype_Docx: req.body.doctype_Docx,
                }
            };

            //update for company details.
            dbo.collection("Generalsetting").updateOne(updt_id, newvalues, function(err, result) {
                if (err) {
                    req.flash('error', lang.__('Error occured in Settings.'));
                    res.redirect('/generalsettings/generalsetting/' + id1);
                } else {
                    dbo.collection("Generalsetting").find(updt_id).toArray(function(err, data1) {


                        req.session.company_logo = logo;
                        req.session.generaldata = data1[0];
                        req.flash('success', lang.__('Company Details Updated Successfully.'));
                        res.redirect('/generalsettings/generalsetting/' + id1);

                    });
                }
            });

        }

        if (loc) {
            var newvalues = {
                $set: {
                    date_format: req.body.date_format,
                    time_format: req.body.time_format,
                    currency: req.body.currency,
                    language: req.body.language

                }
            };

            //update for company details.
            dbo.collection("Generalsetting").updateOne(updt_id, newvalues, function(err, result) {


                if (err) {
                    req.flash('error', lang.__('Error occured in Settings.'));
                    res.redirect('/generalsettings/generalsetting/' + id1);
                } else {

                    dbo.collection("Generalsetting").find(updt_id).toArray(function(err, data1) {

                        req.session.company_logo = data1[0].company_logo;
                        req.session.generaldata = data1[0];
                        res.cookie('locale', data1[0].language, {
                            maxAge: 90000000,
                            httpOnly: true
                        });

                        req.flash('success', lang.__('Localization Updated Sucessfully.'));
                        res.redirect('/generalsettings/generalsetting/' + id1);

                    });
                }
            });
        }

        if (finance) {
            var fin = {
                $set: {
                    decimal_separator: req.body.decimal_separator,
                    thousand_separator: req.body.thousand_separator,
                    currency_set: req.body.currency_set,
                    tax_item: req.body.tax_item,
                    Default_tax: req.body.Default_tax,
                    auto_round_off: req.body.auto_round_off

                }
            };

            //update for company details.
            dbo.collection("Generalsetting").updateOne(updt_id, fin, function(err, result) {
                if (err) {
                    req.flash('error', lang.__('Error occured in Settings.'));
                    res.redirect('/generalsettings/generalsetting/' + id1);
                } else {
                    dbo.collection("Generalsetting").find(updt_id).toArray(function(err, data1) {


                        req.session.company_logo = data1[0].company_logo;
                        req.session.generaldata = data1[0];
                        req.flash('success', lang.__('Finance Updated Successfully.'));
                        res.redirect('/generalsettings/generalsetting/' + id1);

                    });
                }
            });


        }

        if (invoice) {
            var inv = {
                $set: {
                    invoice_prefix: req.body.invoice_prefix,
                    invoice_number_format: req.body.invoice_number_format,
                    number_length: req.body.number_length,
                    bank_details: req.body.bank_details,
                    invoice_client_note: req.body.invoice_client_note,
                    invoice_predefined_terms: req.body.invoice_predefined_terms,
                }
            };

            //update for company details.
            dbo.collection("Generalsetting").updateOne(updt_id, inv, function(err, result) {
                if (err) {
                    req.flash('error', lang.__('Error occured in Settings.'));
                    res.redirect('/generalsettings/generalsetting/' + id1);
                } else {
                    dbo.collection("Generalsetting").find(updt_id).toArray(function(err, data1) {


                        req.session.company_logo = data1[0].company_logo;
                        req.session.generaldata = data1[0];
                        req.flash('success', lang.__('Invoice Updated Successfully.'));
                        res.redirect('/generalsettings/generalsetting/' + id1);

                    });
                }
            });


        }
        if (pdf_settings) {

            if (req.file != undefined) {
                var logo1 = req.file.filename;

            } else {
                var logo1 = req.body.sig_photo_old;
            }

            var pdf = {
                $set: {
                    pdf_font: req.body.pdf_font,
                    tbl_head_color: req.body.tbl_head_color,
                    font_size: req.body.font_size,
                    tbl_head_txt_color: req.body.tbl_head_txt_color,
                    pdf_logo_url: req.body.pdf_logo_url,
                    pdf_logo_width: req.body.pdf_logo_width,
                    show_transaction: req.body.show_transaction,
                    show_pdf_signature_invoice: req.body.show_pdf_signature_invoice,
                    show_pdf_signature_creditnote: req.body.show_pdf_signature_creditnote,
                    pdf_format: req.body.pdf_format,
                    signature_image: logo1,
                    //swap_header: req.body.swap_header,


                }
            };

            //update for company details.
            dbo.collection("Generalsetting").updateOne(updt_id, pdf, function(err, result) {
                if (err) {
                    req.flash('error', lang.__('Error occured in Settings.'));
                    res.redirect('/generalsettings/generalsetting/' + id1);
                } else {
                    dbo.collection("Generalsetting").find(updt_id).toArray(function(err, data1) {
                        req.session.company_logo = data1[0].company_logo;
                        req.session.generaldata = data1[0];
                        req.flash('success', lang.__('PDF Settings Updated Successfully.'));
                        res.redirect('/generalsettings/generalsetting/' + id1);

                    });
                }
            });
        }
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
                if (result[0].access_type != undefined) {
                    if (result[0].access_type.generalsetting != undefined) {
                        if (result[0].access_type.generalsetting.view != undefined) {
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