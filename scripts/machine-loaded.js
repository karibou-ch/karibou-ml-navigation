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

//console.log('recommendations',model.output['recommendations'][15])

model.neighbors('739049451726747',10).forEach(neighbor=>{
  if(neighbor.similarity<1){
    return;
  }
  user=customers.find(customer=>customer.id==neighbor.user)||{}
  console.log('- neighbors Delf',neighbor.user, customers.findIndex(customer=>customer.id==neighbor.user),user.pseudo,neighbor.similarity);
});

console.log('----')

// model.recommendations('anonymous',20).forEach(recommend=>{
//   console.log('- recommendations anonymous',products.find(p=>p.sku==recommend.item).title,recommend.score);
// })


model.recommendations('739049451726747',20).forEach(recommend=>{
  console.log('- recommendations Delf',recommend.item, products.find(p=>p.sku==recommend.item).title,recommend.score);
});

console.log('----')

model.ratings('739049451726747',20).forEach(rating=>{
  console.log('- recommendations Delf',rating.item,products.find(p=>p.sku==rating.item).title,rating.score.toFixed(4));
});



// machine.recommendedProducts(false,30).forEach(recommend=>{
//   console.log('- bests Delf',recommend.item, products.find(p=>p.sku==recommend.item).title,recommend.score);
// });