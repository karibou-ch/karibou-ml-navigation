var products = require('../test/data/products.json');
const foods = require('../test/data/food.json');
const leshop = require('../test/data/food-leshop.json');

var concepts = new (require('../lib/concepts'))();


const words=concepts.lexical(products);
// words.sort().forEach((word,i)=>{
//   console.log(word)
// })

// lexico={};
// foods.forEach(food=>{
//   lexico[food.Category.toLowerCase()]=true;
//   // console.log(food.Description.toLowerCase())
// })
// Object.keys(lexico).sort().forEach(word=>{
//   console.log(word)
// })

// Object.keys(leshop).forEach(category=>{
//   console.log('- ',category,'  -----')
//   leshop[category].forEach(sub=>{
//     console.log('  ',sub.name)
//   })
// });
const vegetables = products
                    .filter(product => product.categories == "fruits-legumes")
                    .filter(product => product.photo&&product.photo.length);
console.log('----',vegetables.length)
concepts.detection(vegetables.slice(0)).then(function(output){

  output = concepts.buildIndex(output,.5);
  //
  // save for app
  concepts.save('./products-clarifai.json',{dictionary:words, products:output});

},function(error){
  console.log('----------------',concepts.predicts.length, error.message||error.txt);
  console.log('----------------',error);
  if(concepts.predicts.length>100){
    concepts.save('../test/data/products-clarifai.json',concepts.predicts);
  }
});



