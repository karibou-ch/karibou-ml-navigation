var products = require('../test/data/products-clarifai.json');

var Clarifai = require('clarifai');
var Promise  = require('bluebird');

var graph={};

function saveFile(output){
  var fs = require('fs');
  var content = JSON.stringify(output,0,2);
  fs.writeFile("data/products-edges.json", content, 'utf8', function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("The file was saved!");
  }); 
}



products.forEach(function(concept) {
  concept.tags.forEach(function(name){
    if(!graph[name]){
      graph[name]=[];
    }
    graph[name].push({name:concept.title,categories:concept.categories});
  });
});


Object.keys(graph).forEach(function(tag){
  if(graph[tag].length<2)return;
  console.log('--',tag);
  graph[tag].sort(function(a,b){
    return b.name.localeCompare(a.name);
  }).forEach(function(product){
    console.log('    ',product.name);
  })
});

saveFile(graph);