var mongoose = require('mongoose');
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

console.log(conn);