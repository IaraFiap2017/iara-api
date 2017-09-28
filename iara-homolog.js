// INSTANCIANDO AS BIBLIOTECAS UTILIZADAS NO PROJETO
var http = require('http');
var path = require('path');
var file = require('fs');
var watson = require('watson-developer-cloud');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');
var bodyParser = require("body-parser");
var request = require('request');
var schedule = require('node-schedule');

// AS VARIAVÉIS ABAIXO SÃO UTILIZADAS PARA QUE NOSSA APLICAÇÃO SEJA UM SERVIDOR HTTP
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// AS CREDENCIAIS UTILIZADAS FICAM LOCALIZADAS EM UM ARQUIVO CHAMADO 'credentials.json'
// NESSA LINHA CONVERTEMOS O ARQUIVO JSON EM UM OBJETO JSON
var credentials = JSON.parse(file.readFileSync('credentials.json', 'utf-8'));
// EAAa2lqCFHhIBAG7BtOtopKZAkjXdNricbFxk2ZCVDhZCN6H5QINQvwaIc6oNJcg7AjsXrSZAzvnR1pYHd9IlG5ZBtZCGXo9pivTvdKOB5sxVyl2xwC8w5Is4FRgqgbU0deA6pH1ZB77NKD6tzYjHZBB3oZAakJDmMC8Uz2FOVNSacEKNt82TOUZAxo
// AQUI RETORNAMOS AS CREDENCIAIS EM VARIAVEIS QUE SERÃO UTILIZADAS POSTERIORMENTE
var userName = credentials.userWatson;
var password = credentials.passWatson;
var workspace = credentials.workspaceId;
var tokenFacebook = credentials.tokenFacebook;
var tokenVerificacaoFacebook = credentials.tokenVerificacao;

// A APIKEY É UTILIZADA PARA QUE POSSAMOS NOS COMUNICAR COM O WEBSERVICE DO MONGOLAB 
// ONDE ESTÁ NOSSA BASE DE DADOS EM MONGODB
var apiKey = credentials.apiKeyMongoLab;
var context = {};

// A VARIAVEL IARA É UMA INSTANCIA DA CLASSE WATSON 
// COM OS PARAMETROS ABAIXO CONSEGUIMOS JÁ PREPARAR UM METODO QUE SE COMUNICARÁ COM O CONVERSATION DA IBM
var iara = watson.conversation({
  username: userName,
  password: password,
  version: 'v1',
  version_date: '2017-05-26'
});

// PARA QUE A APLICAÇÃO POSSA RECEBER E ENVIAR REQUISIÇÕES DO FACEBOOK ELA PRECISA DE DOIS TOKENS
// O PRIMEIRO TOKEN É PARA QUE O FACEBOOK RECONHEÇA O ENDEREÇO PARA ONDE DEVE ENVIAR AS MENSAGENS
// ESSE PRIMEIRO TOKEN É A VARIAVÉL 'tokenVerificacaoFacebook' QUE SÓ PRECISA SER VALIDADO UMA VEZ
// DURANTE A CONFIGURAÇÃO DO MESSENGER COM O CHATBOT
router.get('/webhook', function (req, res){
  if (req.query['hub.verify_token'] === tokenVerificacaoFacebook) {
        res.send(req.query['hub.challenge']);
        console.log('Validado com sucesso');
    }
    
    console.log('Token - ' + req.query['hub.verify_token']);
    res.send('Erro de validação no token.');
});

// PARA QUE A APLICAÇÃO RECEBA E ENVIE MENSAGENS PARA O MESSENGER É PRECISO UM SEGUNDO TOKEN
// QUE SE ENCONTRA NA VARIAVÉL 'tokenFacebook'
router.post('/webhook', function(req, res){
  // A APLICAÇÃO RECEBE UM POST DO FACEBOOK E CONTEUDO DO POST É ALOCADO NA VARIAVÉL 'data'
  var data = req.body;
  
  console.log('INFO: Post efetuado com sucesso');
  
  // É FEITA UMA VERIFICAÇÃO PARA SABER SE ESSE POST REALMENTE VEIO DE UMA PÁGINA
  if(data && data.object === 'page'){
    // UM LOOP EM FOREACH É FEITO COM AS ENTRADAS QUE VIERAM NO CONTEUDO DO POST
    data.entry.forEach(function (entry){
      // UMA VEZ QUE EXISTAM CONTEUDOS O ID DA PÁGINA QUE ENVIOU O POST SERÁ ALOCADO EM 'pageID'
      // E O TIMESTAMP DE QUANDO A MENSAGEM FOI ENVIADA SERÁ ALOCADO EM 'timeOfEvent'
      var pageID = entry.id;
      var timeOfEvent = entry.time;
    
      // É FEITO ENTÃO OUTRO LOOP EM FOREACH QUE VERIFICA TODAS AS MENSAGENS RECEBIDAS
      entry.messaging.forEach(function (event){
        // VERIFICA SE A PROPRIEDADE MENSAGEM NAO ESTÁ NULA
        if(event.message){
          // SE NÃO ESTIVER CHAMA A FUNÇÃO QUE IRÁ TRATAR A MENSAGEM
          trataMensagem(event);
        }
      });
    });
    
    // AO FINAL DE TODO POST É NECESSÁRIO ENVIAR UM STATUS 200 PARA QUE O FACEBOOK SAIBA QUE O POST FOI UM SUCESSO
    res.sendStatus(200);
  }
});

// A FUNÇÃO 'trataMensagem' ATUA COMO UM FUNÇÃO DE CONTROLE QUE É RESPONSAVÉL PELAS AÇÕES DO CHATBOT APÓS RECEBER UMA MENSAGEM
// RECEBE UM UNICO PARAMETRO QUE É O EVENT
function trataMensagem(event) {
    console.log("Mensagem recebida com sucesso");
    
    // A VARIAVEL 'iara' QUE É UMA INSTANCIA DO CONVERSATION POSSUE UMA FUNÇÃO CHAMADA 'message' QUE ATUA ENVIAR MENSAGEM PARA O
    // CONVERSATION DA IBM E ESSE RESPONDE A REQUISIÇÃO COM UMA RESPOSTA UTILIZANDO A INTELIGENCIA ARTIFICIAL DO WATSON
    iara.message({
      workspace_id: workspace,
      input: { 'text': event.message.text },
      context: context
    },
    function(err, response){
      if(err){
        // EM CASO DE ERRO O BOBY DA RESPONSE É ENVIADO PARA QUE O ERRO SEJA VERIFICADO
        console.log('INFO: ', err);
        console.log(response);
      }
      else{
        // EM CASO DE SUCESSO A RESPOSTA DO WATSON É ALOCADA NA VARIÁVEL 'respostaWatson'
        var respostaWatson = response.output.text[0];
        console.log("Watson: " + respostaWatson);
          
        // O 'messageData' É UM OBJETO MONTADO NO PADRÃO EM QUE O FACEBOOK RECEBE AS MENSAGENS QUE SERÁ ENVIADAS PARA O CHATBOT
        var messageData = {
                  recipient: {
                  id: event.sender.id
              },
              message: {
                  text: response.output.text[0]
              }
          };
        
        // VERIFICA SE O EVENT NÃO VEIO NEM NULO NEM INDEFINIDO
        if(event.message.text != null && event.message.text != undefined){
          console.log('Event - não está nulo');
          
          request({
            uri: 'https://api.mlab.com/api/1/databases/testeiara/collections/products?q={"name": "' + response.output.text[0] + '"}}&apiKey=' + apiKey
          },
          function (error, response, body){
            if(!error && response.statusCode == 200){
              console.log('Requisição ao MongoLab feita com sucesso...');
              
              var products = JSON.parse(response.body);
              
              if(products.length > 0){
                sendImageFacebook(event.sender.id, products);
              }
              else{
                sendMessageFacebook(messageData);
              }
              
              if(respostaWatson.includes('SÓ CLICAR')){
                sendAutomatizedMessage(event.sender.id, null);
              }
            }
            else{
              console.log('Requisição fracassou');
            }
          });  
        }
        else{
          console.log('Event - está nulo');
        }
      }
    });   
}

// ESSA FUNÇÃO SOLICITA UM PERFUME AO BANCO DE DADOS E O ENVIA UMA MENSAGEM DE VOLTA
// INFORMANDO O NOME DO PERFUME, UMA FOTO E O PREÇO
function callPerfumes(senderId){
    request({
      uri: 'https://api.mlab.com/api/1/databases/testeiara/collections/products?apiKey=' + apiKey
    },
    function (error, response, body) {
      if (!error && response.statusCode == 200 ) {
        console.log('Funcionou...')
        
        var products = JSON.parse(response.body);
        sendImageFacebook(senderId, products);
      } else {
        console.log('Não Funcionou...');
      }
    });
}

function sendProductsByCategory(recipientId, category){
  request({
    uri: 'https://api.mlab.com/api/1/databases/testeiara/collections/products?q={"categories": ["' + category + '"]}&apiKey=' + apiKey
  },
  function (error, response, body){
    if(!error && response.statusCode == 200){
      console.log('Requisição ao MongoLab feita com sucesso...');
      
      var products = JSON.parse(response.body);
      sendImageFacebook(recipientId, products);
    }
    else{
      console.log('Requisição fracassou');
    }
  }); 
}

function sendProductsByName(recipientId, name){
  request({
    uri: 'https://api.mlab.com/api/1/databases/testeiara/collections/products?q={"name": "' + name + '"}}&apiKey=' + apiKey
  },
  function (error, response, body){
    if(!error && response.statusCode == 200){
      console.log('Requisição ao MongoLab feita com sucesso...');
      
      var products = JSON.parse(response.body);
      sendImageFacebook(recipientId, products);
    }
    else{
      console.log('Requisição fracassou');
    }
  });
}

function sendAutomatizedMessage(recipientId, messageData, days = '*', minutes = '*', seconds = '*'){
  var startTime = new Date(Date.now() + 5000);
  var endTime = new Date(startTime.getTime() + 10000);
  var j = schedule.scheduleJob({ start: startTime, end: endTime, rule: '*/1 * * * * *' }, function(){
    var messageDataAuto = {
          recipient: {
          id: recipientId
      },
      message: {
          text: 'Estou em contato seu produto deve ter acabado deseja mais?'
      }
    };
    
    sendMessageFacebook(messageDataAuto);
  });
}

// FUNÇÃO TRATA O QUE SERÁ ENVIADO PARA O FACEBOOK
function sendImageFacebook(recipientId, products) {
  var product = products[0];
  
  var messageDataWithImage = {
    recipient: {
      id: recipientId
    },
    message:{
      attachment:{
        type: "image",
        payload:{
          url: product.imgUrl
        }
      }
    }
  };

  var messageData = {
          recipient: {
          id: recipientId
      },
      message: {
          text: product.name + ' - R$'  + product.salePrice + '0, só isso?'
      }
  };
  
  //Enviar a imagem do produto
  sendMessageFacebook(messageDataWithImage);
  //Enviar a descrição e preço do produto
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

// ESSA FUNÇÃO ENVIA AS MENSAGENS AO FACEBOOK DESDE QUE RECEBA O PARAMETRO CORRETO
function sendMessageFacebook(messageData){
  console.log(messageData);
  
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

    } else {
      console.error(response.body.error);
    }
  });  
}

// INICIA O SERVIDOR HTTP
server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});