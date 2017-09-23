var watson = require('watson-developer-cloud');
const credentials = require("./credentials-all");

// chatbot watson
var iara = watson.conversation({
  username: credentials.userName,
  password: credentials.password,
  version: 'v1',
  version_date: '2017-05-26'
});



function sendMessage(message) {

    iara.message({
      workspace_id: credentials.workspace,
      input: { 'text': message },
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
          
          // A RESPOSTA QUE É ENVIADA DO WATSON CONVERSTAION INDICA UMA INTENÇÃO DA PESSOA QUE FALOU COM O CHATBOT
          // ABAIXO OCORREM VALIDAÇÕES DESSA INTENÇÃO
          if (respostaWatson == 'perfume'){
              console.log("Intenção: Perfume");
              callPerfumes(event.sender.id);
          }
          else if(respostaWatson == ""){
              
          }
          // EM CASO DE NÃO HAVER NENHUMA INTENÇÃO SERÁ ENVIADA UMA MENSAGEM COM A RESPOSTA DO CONVERSATION SEM TRATAMENTO
          else{
              sendMessageFacebook(messageData);    
          }
        }
        else{
          console.log('Event - está nulo');
        }
      }
    });   
}