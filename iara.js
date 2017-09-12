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

var apiKey = 'HeD_ea9KW8_PUHJuJRepwM62gLqwxJ8r';
var context = {};

function trataMensagem(event) {
    console.log("Mensagem recebida com sucesso");
    console.log(event.message.text);
    iara.message({
      workspace_id: workspace,
      input: { 'text': event.message.text },
      context: context
    },
    function(err, response){
      if(err){
        console.log('INFO: ', err);
        console.log(response);
      }
      else{
        var respostaWatson = response.output.text[0];
        console.log("Watson: " + respostaWatson);
          
        if (event.message.text.includes('perfume')){
            console.log("Intenção: Perfume");
            callPerfumes(event.sender.id);
        }
        else if(respostaWatson == ""){
            
        }
        else{
            var messageData = {
                    recipient: {
                    id: event.sender.id
                },
                message: {
                    text: response.output.text[0]
                }
            };
            
            sendMessageFacebook(messageData);    
        }
        
        //console.log('INFO: Iara: ' + response.output.text[0]);
      }
    });   
}

function callPerfumes(senderId){
    request({
      uri: 'https://api.mlab.com/api/1/databases/testeiara/collections/products?apiKey=' + apiKey
    },
    function (error, response, body) {
      if (!error && response.statusCode == 200 ) {
        console.log('Funcionou...')
        
        var json = JSON.parse(response.body);
        //sendMessageFacebook(event.sender.id, 'Poderia ser o ' + json[0].name + ' - R$' + json[0].salePrice);
        sendGenericMessage(senderId, json);
      } else {
        console.log('Não Funcionou...')
        console.log(response.body);
      }
    });
}

function sendGenericMessage(recipientId, products) {
  var elements = products[0];

  console.log(elements);

  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: elements
        }
      }
    }
  };  

  sendMessageFacebook(messageData);
}

function getProductData(product) {
  return {
    title: product.name,
    subtitle: product.description,
    item_url: "https://www.natura.com/",               
    image_url: product.imgUrl
    // buttons: [{
    //   type: "Comprar",
    //   url: "https://www.natura.com/",
    //   title: "Comprar agora"
    // }]
  };
}

function sendMessageFacebookWithImage(objResposta){
    
}

function sendMessageFacebook(messageData){
  /*var messageData = {
        recipient: {
          id: recipientId
        },
        message: {
          text: text
        }
  };*/
  
  console.log(messageData);
  
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: tokenFacebook },
    method: 'POST',
    json: messageData
  },
  function (error, response, body) {
      console.log('response', response);
    if (!error /* && response.statusCode == 200 */) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;
      
      console.log(response.statusCode);

    } else {
      console.error(response.body.error);
    }
  });  
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});

