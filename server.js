//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');
var file = require('fs');
var watson = require('watson-developer-cloud');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');
var bodyParser = require("body-parser");
var request = require('request')
//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));
router.use(bodyParser.json());
//router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.urlencoded({ extended: true }));

var jsonParser = bodyParser.json();

var messages = [];
var sockets = [];

var credentials = JSON.parse(file.readFileSync('credentials.json', 'utf-8'));

var userName = credentials.userWatson;
var password = credentials.passWatson;
var workspace = credentials.workspaceId;
//var tokenFacebook = credentials.tokenFacebook;
var tokenFacebook = 'EAAB5udtsgKsBAAeNOZCNQXAo8FbUisdZAnqRJ7fJK0QvVIXJjCXB4EoCl2mA8Wv8HUq6OP4RG4LhfE9zqkoZBxRyjZBVhfq6ZCo1NGuT5XKJA5sYRuig6zubV6CoKPHOfY7BN3idIXanUerKt8uBPTM77IMQTMVZBkOerbhF9FHKNUr43da7jpWRnrZBZAwiWEcZD';
var token = 'projetoiarafiap';

router.get('/webhook', function (req, res){
  if (req.query['hub.verify_token'] === token) {
        res.send(req.query['hub.challenge']);
        console.log('Validado com sucesso');
    }
    
    console.log('Token - ' + req.query['hub.verify_token']);
    res.send('Erro de validação no token.');
});

router.post('/webhook', jsonParser, function(req, res){
  var data = req.body;
  
  console.log('INFO: Post efetuado com sucesso');
  
  if(data && data.object === 'page'){
    data.entry.forEach(function (entry){
      var pageID = entry.id;
      var timeOfEvent = entry.time;
      
      if(entry.messaging){
        
        console.log('INFO: Mensagem existe');
        entry.messaging.forEach(function (event){
          //console.log('Pegou o event');
          //console.log(event);
          
          if(event.message){
            trataMensagem(event);
          }
        });
      }
      else{
        console.log(Date.now() + ' - Sem a propriedade ENTRY');
      }
    });
    
    res.sendStatus(200);
  }
});

var iara = watson.conversation({
  username: userName,
  password: password,
  version: 'v1',
  version_date: '2017-05-26'
});

var context = {};

function trataMensagem(event) {
  console.log("Mensagem recebida com sucesso");
  
  var recipientId = event.recipient.id;
  
  console.log('Recipient ID :: ' + recipientId);
  
  iara.message({
    workspace_id: workspace,
    input: { 'text': event.message.text },
    context: context
  },
  function(err, response){
    if(err){
      console.log('INFO: ', err);
    }
    else{
      console.log('INFO: Iara: ' + response.output.text[0]);
      
      //event.sender.id
      //sendMessageFacebook(event.recipient.id, response.output.text[0]);
      sendMessageFacebook(event.sender.id, response.output.text[0]);
    }
  }); 
}

function sendMessageFacebook(recipientId, text){
  var messageData = {
        recipient: {
          id: recipientId
        },
        message: {
          text: text
        }
  };
  
  console.log('INFO: Enviando mensagem (' + messageData.message.text + ')');
  
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: tokenFacebook },
    method: 'POST',
    json: messageData
  },
  function (error, response, body) {
    if (!error /* && response.statusCode == 200 */) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;
      
      console.log(response.statusCode);

      console.log("INFO: Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error(response.body.error);
    }
  });  
}

io.on('connection', function (socket) {
    messages.forEach(function (data) {
      socket.emit('message', data);
    });

    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      updateRoster();
    });

    socket.on('message', function (msg) {
      var text = String(msg || '');

      if (!text)
        return;

      socket.get('name', function (err, name) {
        var data = {
          name: name,
          text: text
        };

        broadcast('message', data);
        messages.push(data);
      });
    });

    socket.on('identify', function (name) {
      socket.set('name', String(name || 'Anonymous'), function (err) {
        updateRoster();
      });
    });
  });

function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', callback);
    },
    function (err, names) {
      broadcast('roster', names);
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});

