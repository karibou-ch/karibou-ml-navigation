var products = require('../test/data/products-clarifai.json');

var Clarifai = require('clarifai');
var Promise  = require('bluebird');

var classification={};

function saveFile(output){
  var fs = require('fs');
  var content = JSON.stringify(output,0,2);
  fs.writeFile("data/concepts.json", content, 'utf8', function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("The file was saved!");
  }); 
}


products.forEach(function(concept) {
  if(!classification[concept.categories]){
    classification[concept.categories]={};
  }
  concept.tags.forEach(function(name){
    if(!classification[concept.categories][name]){
      classification[concept.categories][name]=0;
    }
    classification[concept.categories][name]++;
  });
});


Object.keys(classification).forEach(function(category){
  console.log('--',category);
  Object.keys(classification[category]).sort(function(a,b){
    return classification[category][b]-classification[category][a];
  }).forEach(function(name){
    if(classification[category][name]>1)
    console.log('  ',name,classification[category][name]);
  })
});

saveFile(classification)