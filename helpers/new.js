var hbs1 = require('hbs');
var fs = require('fs');
var db = require('../routes/mongo_db');
var ObjectId = require('mongodb').ObjectId;
var Promise = require('rsvp').Promise;
var  i18n = require('i18n');
var str="";
var time="";
var dateFormat = require('dateformat');
var Handlebars=require( 'express-handlebars' );
module.exports.register = function (options)  { 
  Handlebars.registerAsyncHelper('get_customedata', function (custom_id,ref_id)  { 
   var xyz = db.get();
		console.log("In new.js");
		 // var query ={custom_field_id:ObjectId(custom_id),referce_id:ObjectId(ref_id)};
		  xyz.collection("custom_field_meta").find().toArray(function(err, result) {
			  console.log("Helooo mansi jkljlklkjkjkjlkjlkj");
			
			  		 var m=  {
					  title: "First Post",
					  story: {
						intro: "Before the jump",
						body: "After the jump"
					  }
					}
				return options.fn(m);
			  var data1=result[0].customfield_value;
			   //return options.fn(this);
			   
		  });
  });
};
/* module.exports = {
      
	  get_customedata: function(custom_id,ref_id,options){
		  var xyz = db.get();
		 // var query ={custom_field_id:ObjectId(custom_id),referce_id:ObjectId(ref_id)};
		  xyz.collection("custom_field_meta").find().toArray(function(err, result) {
			  console.log("Helooo mansi jkljlklkjkjkjlkjlkj");
			
			  		 var m=  {
					  title: "First Post",
					  story: {
						intro: "Before the jump",
						body: "After the jump"
					  }
					}
				return options.fn(m);
			  var data1=result[0].customfield_value;
			   //return options.fn(this);
			   
		  });

	  },
	 
      
} */