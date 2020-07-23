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

let delfidx=customers.findIndex(customer=>customer.id==739049451726747)
console.log('- delf row',model.model.input[delfidx].join(','))

model.model.input.forEach((udx,i)=>{
  if(model.model.input[i].reduce((sum,value)=>{return sum+value},0)<20){
    return;
  }
  console.log('- delf row',i,customers[i].id,customers[i].pseudo,model.model.input[i].join(','))

})
