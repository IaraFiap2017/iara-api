// dependencies
const credentials = require("./credentials2");
var express = require('express');
//var bodyParser = require("body-parser");
//var path = require('path');
var http = require('http');
var socketio = require('socket.io');
var watson = require('watson-developer-cloud');
//var file = require('fs');

//var async = require('async');
//var request = require('request';)


// application server instance and config
var app = express();
//router.use(express.static(path.resolve(__dirname, 'client')));
//router.use(bodyParser.json());
//router.use(bodyParser.urlencoded({ extended: true }));
var server = http.createServer(app);
var serverListener = socketio.listen(server);


// chatbot wtson
var iara = watson.conversation({
  username: credentials.userName,
  password: credentials.password,
  version: 'v1',
  version_date: '2017-05-26'
});