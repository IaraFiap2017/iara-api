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
var doFilter = function (senderId, message, listProducts) {
    if(message == 'imagem'){
        //var waitMessageData = facebookService.methods.createSimpleMessageObject(senderId, "Aguarde um momento, por favor.");
        //facebookService.methods.sendMessage(waitMessageData);
        
        mongoService.methods.queryProductByName(listProducts[0], function(products) {
            console.log(listProducts[0]);
            
            if(products[0]){
                var comboMessageData = facebookService.methods.createComboMessageObject(senderId, products[0]);    
                facebookService.methods.sendMessage(comboMessageData);
            }
        });
    } else {
        if(message.includes('desodorante') || message.includes('Desodorante')){
            var nameProduct = 'Desodorante Antitranspirante Roll-on Natura Homem - 75 ml';
            mongoService.methods.queryProductByName(nameProduct, function(products){
                
                if(products.length > 0){
                    if(products[0]){
                        var comboMessageData = facebookService.methods.createComboMessageObject(senderId, products[0]);
                        facebookService.methods.sendMessage(comboMessageData);
                    }
                }
            });
        }
        else{
            watsonService.methods.sendToWatson(message, function(response){
                mongoService.methods.queryProductByName(response, function(products){
                    if(products.length > 0){
                        if(products[0]){
                            var messageData = facebookService.methods.createSimpleMessageObject(senderId, 'Só isso?');
                            var comboMessageData = facebookService.methods.createComboMessageObject(senderId, products[0]);
                            facebookService.methods.sendMessage(comboMessageData);
                            facebookService.methods.sendMessage(messageData);
                        }            
                    } else if (message.includes('Pode sim') || message.includes('pode sim') || message.includes('Quero sim') || message.includes('quero sim')){
                        var prod = 'Shampoo Anticaspa Natura Homem - 300ml';
                    
                        mongoService.methods.queryProductByName(prod, function(products){
                            var messageDataImage = facebookService.methods.createImageMessageObject(senderId, products[0].imageUrl);
                            var text = products[0].name + ' - R$'  + products[0].salePrice + '0, pode ser?';
                            var messageDataSimple = facebookService.methods.createSimpleMessageObject(senderId, text);
                        
                            facebookService.methods.sendMessage(messageDataImage);
                            facebookService.methods.sendMessage(messageDataSimple);
                        });                
                    } else {
                        var messageData = facebookService.methods.createSimpleMessageObject(senderId, response);
                        facebookService.methods.sendMessage(messageData);
                    
                        if(response.includes('fechar a compra')){
                            facebookService.methods.getSenderUserInfo(senderId, function(data){
                                sendAutomatizedMessage(senderId, data.first_name, product);
                        });
                    }
                 }
                });
            });
        }
    }
}

function sendAutomatizedMessage(recipientId, firstName, product){
  var startTime = new Date(Date.now() + 11000);
  var endTime = new Date(startTime.getTime() + 1000);
  var j = schedule.scheduleJob({ start: startTime, end: endTime, rule: '*/1 * * * * *' }, function(){
    var text = 'Olá ' + firstName + ' estou em contato porque seu Desodorante Antitranspirante Roll-on Natura Homem - 75 ml , deve ter acabado deseja mais?';
    
    var messageData = facebookService.methods.createSimpleMessageObject(recipientId, text);
    facebookService.methods.sendMessage(messageData);
  });
}

module.exports.filters = {
    "doFilter": doFilter
}