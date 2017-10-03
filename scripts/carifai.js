var products = require('../test/data/products');

var Clarifai = require('clarifai');
var Promise  = require('bluebird');

// output classification
var output=[],today=new Date();

function saveFile(output){
  var fs = require('fs');
  var content = JSON.stringify(output,0,2);
  fs.writeFile("products-clarifai.json", content, 'utf8', function (err) {
      if (err) {
          return console.log(err);
      }
      console.log("The file was saved!");
  }); 
}

// api key (scope=all)
var key='d45ec8c49d63443aa2375e5eb2a18a51';
var app = new Clarifai.App({
  apiKey: key
});

//
// 
Promise.mapSeries(products,function(product,i){
  //
  //
  return app.models.predict(Clarifai.FOOD_MODEL, 'https:'+product.photo.url,{language: 'en'}).then(function(res){
    return res.outputs[0].data.concepts;
  });
}).then(function(predicts){
  predicts.forEach(function(concepts,i){
    products[i].tags=concepts.filter(function(concept) {return (concept.value>0.95);}).map(function(e){return e.name});
    output.push({
      sku:products[i].sku,
      title:products[i].title,
      tags:products[i].tags,
      image:products[i].photo.url,
      categories:products[i].categories,
      updated:today
    });
  });

  //
  //
  saveFile(output);
})

