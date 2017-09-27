const credentials = require("./credentials-all");
var request = require('request');


var queryAllCategories = function() {
  
  // TODO buscar realmente todas as categorias
  return ["Perfumaria", "Barba"];
}


var queryProductByName = function(name, callback) {
  request({
    uri: 'https://api.mlab.com/api/1/databases/testeiara/collections/products?q={"name": "' + name + '"}}&apiKey=' + credentials.all.apiKeyMongoLab},
    function (error, response, body) {
      if(!error && response.statusCode == 200) {
        callback(JSON.parse(response.body));
      } else {
      console.log('queryProductByName failed!');
    }
  }); 
}


var queryProductByCategory = function(category, callback) {
  request({
    uri: 'https://api.mlab.com/api/1/databases/testeiara/collections/products?q={"categories": ["' + category + '"]}&apiKey=' + credentials.all.apiKeyMongoLab},
  function (error, response, body){
    if(!error && response.statusCode == 200){
      callback(JSON.parse(response.body));
    } else {
      console.log('queryProductByCategory failed!');
    }
  }); 
}


module.exports.methods = {
  "queryAllCategories": queryAllCategories,
  "queryProductByName": queryProductByName,
  "queryProductByCategory": queryProductByCategory
}