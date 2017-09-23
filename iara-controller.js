const credentials = require("./credentials-all");
const iaraFilter = require("./iara-filter");

// application server instance and config
var express = require('express');
var app = express();


module.exports.app = app;


// first facebook token verification (only one time request!)
app.get('/webhook', function (req, res){
  if (req.query['hub.verify_token'] === credentials.tokenVerificacaoFacebook) {
    res.send(req.query['hub.challenge']);
  }
  res.send('Erro de validação no token.');    
});


// facebook messages are received here
app.post('/webhook', function(req, res){
  var allMessages = ""
  
  if(req.body && req.body.object === 'page') {
    req.body.entry.forEach(function(e){
      e.messaging.forEach(function(event){
        if(event.message){
          allMessages = allMessages + " " + event.message;
        }
      })
    });
    
    // if there is a message let's send it to filter
    if(allMessages.length > 1) {
      iaraFilter.doFilter(allMessages);     
    }
  }
  
  // success status to facebook is required
  res.sendStatus(200);
});