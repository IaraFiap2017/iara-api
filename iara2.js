// dependencies
const credentials = require("./credentials2");
var express = require('express');
//var bodyParser = require("body-parser");
//var path = require('path');
var http = require('http');
var socketio = require('socket.io');
//var file = require('fs');
//var watson = require('watson-developer-cloud');
//var async = require('async');
//var request = require('request';)


// application server instance and config
var app = express();
//router.use(express.static(path.resolve(__dirname, 'client')));
//router.use(bodyParser.json());
//router.use(bodyParser.urlencoded({ extended: true }));
var server = http.createServer(app);
var serverListener = socketio.listen(server);



