var express = require('express');
var bodyParser = require('body-parser');
var watson = require('watson-developer-cloud');
var file = require('fs');
var http = require("http");

var contexid = "";

var credentials = JSON.parse(file.readFileSync('credentials.json', 'utf-8'));

var userName = credentials.userWatson;
var password = credentials.passWatson;
var workspace = credentials.workspaceId;
var tokenFacebook = credentials.tokenFacebook;

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


var conversation_id = "";
var w_conversation = watson.conversation({
    //url: 'https://gateway.watsonplatform.net/conversation/api',
    username: process.env.CONVERSATION_USERNAME || userName,
    password: process.env.CONVERSATION_PASSWORD || password,
    version: 'v1',
    version_date: '2016-07-11'
});

app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === tokenFacebook) {
        res.send(req.query['hub.challenge']);
    }
    
    console.log('Token - ' + req.query['hub.verify_token']);
    res.send('Erro de validação no token.');
});

app.post('/webhook', function (req, res) {
	var text = null;
	
    messaging_events = req.body.entry[0].messaging;
	for (var i = 0; i < messaging_events.length; i++) {	
        var event = req.body.entry[0].messaging[i];
        var sender = event.sender.id;

        if (event.message && event.message.text) {
			text = event.message.text;
		}else if (event.postback && !text) {
			text = event.postback.payload;
		}else{
			break;
		}
		
		var params = {
			input: text,
			// context: {"conversation_id": conversation_id}
			context:contexid
		};

		var payload = {
			workspace_id: workspace
		};

		if (params) {
			if (params.input) {
				params.input = params.input.replace("\n","");
				payload.input = { "text": params.input };
			}
			if (params.context) {
				payload.context = params.context;
			}
		}
		callWatson(payload, sender);
    }
    res.sendStatus(200);
});

function callWatson(payload, sender) {
	w_conversation.message(payload, function (err, convResults) {
		 console.log(convResults);
		contexid = convResults.context;
		
        if (err) {
            return responseToRequest.send("Erro.");
        }
		
		if(convResults.context != null)
    	   conversation_id = convResults.context.conversation_id;
        if(convResults != null && convResults.output != null){
			var i = 0;
			while(i < convResults.output.text.length){
				sendMessage(sender, convResults.output.text[i++]);
			}
		}
    });
}

function sendMessage(sender, text_) {
	text_ = text_.substring(0, 319);
	messageData = {	text: text_ };

    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        method: 'POST',
        json: {
            recipient: { id: sender },
            message: messageData,
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};

console.log('Rodando..');

var token = credentials.tokenFacebook;

var host = process.env.IP;
var port = process.env.PORT;

var server = http.createServer(app);

server.listen(process.env.PORT, host, () => { 
    console.log('Running on port ' + port + ' and IP ' + host);
});