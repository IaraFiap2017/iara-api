var watson = require('watson-developer-cloud');
const credentials = require("./credentials-all");

/* watson conversation */
var iara = watson.conversation({
  username: credentials.all.userWatson,
  password: credentials.all.passWatson,
  version: 'v1',
  version_date: '2017-05-26'
});


var sendToWatson = function(message, callback) {

  iara.message({
      workspace_id: credentials.all.workspaceId,
      input: { 'text': message },
      context: {}
    },
    
    function(err, response) {
      if(err) {
        console.error(err);
      } else {
        callback(response.output.text[0]);
      }
  }); 
  
}


module.exports.methods = {
  "sendToWatson": sendToWatson
}