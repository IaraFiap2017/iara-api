const watsonService = require("./watson-service");
const mongoService = require("./mongo-lab-service");
const facebookService = require("./facebook-service");
const schedule = require('node-schedule');

var categories = null;
var product = null;

var lookForCategories = function(message) {
    var categoriesOnMessage = [];

    if(categories == null) {
        /* All categories on DB */
        categories = mongoService.methods.queryAllCategories();
    }
    
    /* Is there any category on the message? */
    for(var i in categories) {
        if(message.search(categories[i]) > -1) {
            categoriesOnMessage.push(categories[i]);
        }
    }
    
    return categoriesOnMessage;
}

/*
    Fluxo do Filtro:
        procura uma categoria no texto da mensagem
        se encontrar já consulta o mongodb e retorna o primeiro produto (precisamos melhorar, mandar vários)
        se nao encontrar chama a iara (watson conversation) e devolve a resposta 
        
        podemos agora com tudo funcionando pensar em armazenar o id do chat do usuário e sua última consulta ou algo do tipo...
*/
var doFilter = function (senderId, message) {
    watsonService.methods.sendToWatson(message, function(response){
        mongoService.methods.queryProductByName(response, function(products){
            if(products.length > 0){
                var messageDataImage = facebookService.methods.createImageMessageObject(senderId, products[0].imgUrl);
                
                var text = products[0].name + ' - R$'  + products[0].salePrice + '0, só isso?';
                var messageData = facebookService.methods.createSimpleMessageObject(senderId, text);
                
                product = products[0].name;
                
                facebookService.methods.sendMessage(messageDataImage);
                facebookService.methods.sendMessage(messageData);
            }
            else{
                var messageData = facebookService.methods.createSimpleMessageObject(senderId, response);
                facebookService.methods.sendMessage(messageData);
                
                if(response.includes('fechar a compra')){
                    facebookService.methods.getSenderUserInfo(senderId, function(data){
                        sendAutomatizedMessage(senderId, data.first_name, product);
                    })
                }
            }
        });
    });
    
    
    /*if(messageProductNames.length > 0){
        console.log(messageProductNames);
    }
    else{
        console.log('Sem valores');
    }*/
    
    /*var messageCategories = lookForCategories(message);
    
    if(messageCategories.length > 0) {
        
        // TODO considerar buscar mais de uma categoria em uma única busca
        // TODO enviar mais de um produto ao facebook
        mongoService.methods.queryProductByCategory(
            messageCategories[0], 
            function(products) {
                var messageObject = facebookService.methods.createImageMessageObject(senderId, products[0].imgUrl);
                
                console.log(messageObject);
                
                /*facebookService.methods.sendMessage(
                    facebookService.methods.createImageMessageObject(senderId, products[0].imgUrl)
                );
            }
        );*/
        
        
    // TODO else if (messageProductNames > 0) => buscar produtos no MongoDB e enviar 
    /*
    } else {
        watsonService.methods.sendToWatson(
            message,
            function(watsonReceivedMessage) {
                var messageObject = facebookService.methods.createImageMessageObject(senderId, watsonReceivedMessage);
                
                console.log(messageObject);
                
                /*
                facebookService.methods.sendMessage(
                    facebookService.methods.createSimpleMessageObject(senderId, watsonReceivedMessage)
                );
            }
        );
    }*/
}

function sendAutomatizedMessage(recipientId, firstName, product){
  var startTime = new Date(Date.now() + 5000);
  var endTime = new Date(startTime.getTime() + 1000);
  var j = schedule.scheduleJob({ start: startTime, end: endTime, rule: '*/1 * * * * *' }, function(){
    var text = 'Olá ' + firstName + ' estou em contato porque seu ' + product + ', deve ter acabado deseja mais?';
    
    var messageData = facebookService.methods.createSimpleMessageObject(recipientId, text);
    facebookService.methods.sendMessage(messageData);
  });
}

module.exports.filters = {
    "doFilter": doFilter
}
    