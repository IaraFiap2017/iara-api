/* Server dependencies */
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');
const app = express();
const server = http.createServer(app);


/* Project dependencies */
const credentials = require("./credentials-all");
const iaraFilter = require("./iara-filter");


/* Config to receive the body on Facebook Messenger request */
app.use(express.static(path.resolve(__dirname, 'client')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


/* For Facebook Validation (only one time!) */
app.get('/webhook', function (req, res){
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === credentials.all.passFacebook) {
      res.status(200).send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);    
  }
});


/* Handling all messenges */
app.post('/webhook', function(req, res){
  
  if(req.body && req.body.object === 'page') {
    req.body.entry.forEach(function(entry){
      entry.messaging.forEach(function(event){
        if(event.message && event.message.text && !event.message.is_echo){
          iaraFilter.filters.doFilter(event.sender.id, event.message.text);
        }
      })
    });
    
    /* success status to facebook */
    res.status(200).end();
  }
});


/* Start http server */
server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});