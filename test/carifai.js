var should = require('should');
var products = require('./data/products');
var orders = require('./data/orders.json');

var Clarifai = require('clarifai');
var Promise  = require('bluebird');

describe('Clarifai API', function() {
  // api key (scope=all)
  var key='d45ec8c49d63443aa2375e5eb2a18a51';
  var app = new Clarifai.App({
    apiKey: key
  });
  it('predict product concepts from image ', function(done) {
    this.timeout(500000);
    products.should.be.an.Array();    
    //
    // 
    Promise.mapSeries(products,function(product,i){
      if(i<226||i>430){return []}
      //
      return app.models.predict(Clarifai.FOOD_MODEL, 'https:'+product.photo.url,{language: 'en'}).then(function(res){
        return res.outputs[0].data.concepts;
      });
    }).then(function(predicts){
      predicts.forEach(function(concepts,i){
        if(!concepts.length)return
        //console.log('node: ',products[i].title);
        console.log(products[i].title,':',concepts.filter(function(concept) {return (concept.value>0.95);}).map(function(e){return e.name}).join(','))
      })
      done();
    })
  });
  
});