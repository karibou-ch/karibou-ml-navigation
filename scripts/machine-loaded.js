var Recommender    = require('likely');
const MachineIndex = require('../lib/machine-index');

const orders       = require('../test/data/orders.json');
const products     = require('../test/data/products.json');

const customers = orders.map(order=>order.customer).filter((elem, pos, arr) => {
  return arr.findIndex(a=>a.id==elem.id) == pos;
});

console.log("loading model")


let time=Date.now();

// E**O//2360346371241611  C**D//739049451726747   dummy
// machine.load(__dirname).then((model)=>{
let model=MachineIndex.load(__dirname,'test');


// model.neighbors('739049451726747',10).forEach(neighbor=>{
//   let user=customers.find(customer=>customer.id==neighbor.user)||{};
//   let udx=customers.findIndex(customer=>customer.id==neighbor.user);
//   console.log('- neighbors Delf',neighbor.user, udx,user.pseudo,neighbor.similarity);
//   // model.ratings(customers[udx].id,10).forEach(rating=>{
//   //   console.log('-  ',rating.item,products.find(p=>p.sku==rating.item).title,rating.score.toFixed(4));
//   // });
  
// });

// category
let category='produits-laitiers'
// let category='fruits-legumes';
console.log('---- category',category,'DISCOUT',products.filter(p=>p.discount).length)


// model.recommendations('anonymous',30).forEach(recommend=>{
//   console.log('- recommendations anonymous',products.find(p=>p.sku==recommend.item).title,recommend.score);
// })


model.recommendations('739049451726747',30,category).forEach(recommend=>{
  console.log('- recommendations Delf',recommend.item, products.find(p=>p.sku==recommend.item).title,recommend.score);
});


console.log('----', (Date.now()-time),'ms');time=Date.now();

model.ratings('739049451726747',20,category).forEach(rating=>{
  let prod=products.find(p=>p.sku==rating.item);
  console.log('- rating Delf',rating.item,prod.title,prod.discount?'DISCOUNT':'',rating.score.toFixed(4));
});

console.log('----', (Date.now()-time),'ms');time=Date.now();

model.ratings('anonymous',20,category).forEach(rating=>{
  let prod=products.find(p=>p.sku==rating.item);
  console.log('- rating anonymous',rating.item,prod.title,prod.discount?'DISCOUNT':'',rating.score.toFixed(4));
});
console.log('----', (Date.now()-time),'ms');time=Date.now();


// machine.recommendedProducts(false,30).forEach(recommend=>{
//   console.log('- bests Delf',recommend.item, products.find(p=>p.sku==recommend.item).title,recommend.score);
// });