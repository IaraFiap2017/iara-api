// dependencies
const credentials = require("./credentials-all");

//var bodyParser = require("body-parser");
//var path = require('path');
var http = require('http');
var socketio = require('socket.io');

//var file = require('fs');

//var async = require('async');
//var request = require('request';)



//router.use(express.static(path.resolve(__dirname, 'client')));
//router.use(bodyParser.json());
//router.use(bodyParser.urlencoded({ extended: true }));
var server = http.createServer(app);
var serverListener = socketio.listen(server);


