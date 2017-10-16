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


var lista1 = ['Desodorante Colônia Natura Homem Madeiras 100 ml', 'Gel Fixador Para Cabelos Natura Homem - 100g', 'Espuma de Barbear Natura Homem - 180g / 200ml']
var lista2 = ['Deo Parfum Essencial Masculino - 100ml', 'Espuma de Barbear Natura Homem - 180g / 200ml', 'Sabonete em Barra Cremoso e Refrescante Natura Homem - 3 un de 110g cada']
var lista3 = ['Sabonete em Barra Puro Vegetal Sortido - 4 un de 100g cada', 'Óleo Fortalecedor Ekos Patauá - 100ml', 'Desodorante Colônia Feminino Luna - 75ml']
var contador = 1;
var listas = [lista1, lista2, lista3]

function retornaListaRandomica() {
  contador++
  if(contador > 3) {
    contador = 1
    return listas[0]
  } else {
    return listas[contador - 1]
  }
}


/* Handling all messenges */
app.post('/webhook', function(req, res){
  
  if(req.body && req.body.object === 'page') {
    req.body.entry.forEach(function(entry){
      entry.messaging.forEach(function(event){
        if(event.message && event.message.text && !event.message.is_echo){
          iaraFilter.filters.doFilter(event.sender.id, event.message.text, null);
        }
        else if(event.message && event.message.attachments){
          iaraFilter.filters.doFilter(event.sender.id, 'imagem', retornaListaRandomica());
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