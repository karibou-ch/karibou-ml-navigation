var products = require('../test/data/products-clarifai.json');
var Concepts = require('../lib/concepts')


new Concepts().buildIndex(products).forEach(p=>{
  console.log('-- ',p.title)
  p.tags.forEach(tag=> {
    console.log('  #',tag.name,tag.score.toFixed(2));

  })
});