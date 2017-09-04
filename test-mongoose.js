/*var mongoose = require('mongoose');
mongoose.createConnection('mongodb://testeiara:Iara@2017@ds119044.mlab.com:19044/testeiara', {
    uri_decode_auth: true 
  },
  function(err, db){
    
  }
);

var conn = mongoose.connection.on('open', function () {
    console.log('Até vai...');
    mongoose.connection.db.listCollections().toArray(function (err, names) {
      console.log('Até vai...');
      if (err) {
        console.log(err);
      } else {
        console.log('Até vai...');
        
        console.log(names);
      }

      mongoose.connection.close();
    });
});

console.log(conn);*/

var request = require('request');

var apiKey = 'HeD_ea9KW8_PUHJuJRepwM62gLqwxJ8r';

request({
    uri: 'https://api.mlab.com/api/1/databases/testeiara/collections/products?apiKey=' + apiKey
  },
  function (error, response, body) {
    if (!error && response.statusCode == 200 ) {
      console.log('Funcionou...')
      
      var json = JSON.parse(response.body);
      
      console.log(json[0].name);
    } else {
      
      console.log('Não Funcionou...')
      console.log(response.body);
    }
  }); 

