const watsonService = require("./watson-service");
const mongoService = require("./mongo-lab-service");
const facebookService = require("./facebook-service");


var categories = null;


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

    var messageCategories = lookForCategories(message);
    
    if(messageCategories.length > 0) {
        
        // TODO considerar buscar mais de uma categoria em uma única busca
        // TODO enviar mais de um produto ao facebook
        
        mongoService.methods.queryProductByCategory(
            messageCategories[0], 
            function(products) {
                facebookService.methods.sendMessage(
                    facebookService.methods.createImageMessageObject(senderId, products[0].imgUrl)
                )
            }
        );
        
        
    // TODO else if (messageProductNames > 0) => buscar produtos no MongoDB e enviar 
        
    } else {
        watsonService.methods.sendToWatson(
            message,
            function(watsonReceivedMessage) {
                facebookService.methods.sendMessage(
                    facebookService.methods.createSimpleMessageObject(senderId, watsonReceivedMessage)
                )   
            }
        );
    }
}


module.exports.filters = {
    "doFilter": doFilter
}
    