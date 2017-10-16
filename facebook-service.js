/* Project dependencies */
const credentials = require("./credentials-all");
const request = require('request');

var sendMessage = function(messageObject){
    request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token: credentials.all.tokenFacebook},
    method: 'POST',
    json: messageObject
  }, function (error, response) {
    if (!error && response.statusCode == 200) {
        console.log('Mensagem Enviada com sucesso ao facebook');
    } else if (response.body.error) {
        console.log('Error: ', response.body.error);
    }
  });
}

var getSenderUserInfo = function(senderId, callback){
    request({
        url: 'https://graph.facebook.com/v2.6/' + senderId + '?access_token=' + credentials.all.tokenFacebook,
        method: 'GET'
    }, function(error, response) {
        if(!error && response.statusCode == 200){
            callback(JSON.parse(response.body));
        }
        else{
            console.log('ERROR :: ' + response);
        }
    });
}

var createComboMessageObject = function(senderId, product) {
    
    var messageData = {
        recipient: {
            id: senderId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: [{
                        title: product.name,
                        subtitle: formataPreco(product.salePrice),
                        item_url: "http://www.natura.com.br",
                        image_url: product.imgUrl,
                        buttons: [{
                            type: "web_url",
                            url: "http://www.natura.com.br",
                            title: "Ver Detalhes"
                        }, {
                            type: "web_url",
                            url: "http://www.natura.com.br",
                            title: "Comprar Agora"
                        }],
                    }]
                }
            }
        }
    };
    
    return messageData;
}

function formataPreco(price) {
    return 'R$ ' + price.toFixed(2).toString().replace('.', ',');
}

var createSimpleMessageObject = function(senderId, message){
    var messageObject = {
        recipient: { 
            id: senderId
        },
        message: {
            text: message
        }
    }
    
    return messageObject
}

var createImageMessageObject = function(senderId, imageUrl){
    var messageObject = {
        recipient: {
            id: senderId
        },
        message:{
            attachment:{
                type: "image",
                payload:{
                    url: imageUrl
                }
            }
        }
    };
  
    return messageObject;
}

module.exports.methods = {
    "sendMessage": sendMessage,
    "createSimpleMessageObject": createSimpleMessageObject,
    "createImageMessageObject": createImageMessageObject,
    "createComboMessageObject": createComboMessageObject,
    "getSenderUserInfo": getSenderUserInfo,
}