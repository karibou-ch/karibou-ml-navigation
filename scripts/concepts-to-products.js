var products = require('../test/data/products-clarifai.json');
var Concepts = require('../lib/concepts')

var output=[];
var concepts=new Concepts();
concepts.buildIndex(products).forEach(p=>{
  output.push({
    sku:p.sku,
    title:p.title,
    image:p.image,
    categories:p.categories,
    tags:p.tags,
    updated:p.updated,
    linked:concepts.similar(p,0.9)
  });
});


//
// save for app
concepts.save('../app/products-concepts-group/app/assets/products.json',output);