var watson = require('watson-developer-cloud');
const credentials = require("./credentials-all");

// chatbot watson
var iara = watson.conversation({
  username: credentials.userName,
  password: credentials.password,
  version: 'v1',
  version_date: '2017-05-26'
});

