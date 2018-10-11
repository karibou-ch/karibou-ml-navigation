var products = require('../test/data/products-clarifai.json');

var Clarifai = require('clarifai');
var Promise  = require('bluebird');

var concepts = new (require('../lib/concepts'))();

var classification={graph:[]};

function saveFile(output,file){
  var fs = require('fs');
  var content = JSON.stringify(output,0,2);
  fs.writeFile(file||"data/concepts.json", content, 'utf8', function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("The file was saved!");
  }); 
}

//
// add tags scoring
concepts.buildIndex(products,0.9).forEach((p,i)=>{
  p.tags=p.tags.map(tag=>tag.name);
  // products[i]=p;
});
concepts.save('../test/data/tags-lexico.json',concepts.buildLexico(products));
concepts.save('../test/data/products-clarifai2.json',products);


products.forEach(function(concept) {
  if(!classification[concept.categories]){
    classification[concept.categories]={};
  }
  concept.tags.forEach(function(tag){
    if(tag.score<.85){
      return;
    }
    // console.log('----------------',concept.categories, tag.name,tag.score)
    if(!classification[concept.categories][tag.name]){
      //classification.graph.push({node:concept.categories, vertex:tag.name, weight:tag.score});
      classification[concept.categories][tag.name]=0;
    }
    classification[concept.categories][tag.name]++;
  });
});


Object.keys(classification).forEach(function(category){
  console.log('--',category);
  Object.keys(classification[category]).sort(function(a,b){
    return classification[category][b]-classification[category][a];
  }).forEach(function(name){
  })
});

Object.keys(classification).forEach(function(cat){
  console.log('  -----',cat);
  Object.keys(classification[cat]).forEach(function(tag){
    console.log('      -',tag,classification[cat][tag]);

  })
});

//saveFile(classification.graph)