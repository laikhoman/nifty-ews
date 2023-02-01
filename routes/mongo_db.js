'use strict';
const mongoClient = require('mongodb').MongoClient;
if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    var localStorage = new LocalStorage('./scratch');
}
var dbname = localStorage.getItem("database");
var DB_NAME = dbname;
const mongoDbUrl = 'mongodb://127.0.0.1:27017/' + DB_NAME;
console.log(mongoDbUrl);
// const mongoDbUrl = 'mongodb://127.0.0.1:27017/BankingSystem';
let mongodb;
var express = require('express');
var app = express();

function connect(callback) {
    mongoClient.connect(mongoDbUrl, {
        useNewUrlParser: true
    }, (err, db) => {
        mongodb = db;
        callback();
    });
}

function get() {
    return mongodb;
}

function close() {
    mongodb.close();
}

module.exports = {
    connect,
    get,
    close
};