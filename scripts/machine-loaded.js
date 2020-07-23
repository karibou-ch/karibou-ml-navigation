var Recommender    = require('likely');
const MachineIndex = require('../dist/').MachineIndex;

const orders       = require('../test/data/orders.json');

const customers = orders.map(order=>order.customer).filter((elem, pos, arr) => {
  return arr.findIndex(a=>a.id==elem.id) == pos;
});

console.log("loading model")


let time=Date.now();

// E**O//2360346371241611  C**D//739049451726747   dummy
// machine.load(__dirname).then((model)=>{
const model=MachineIndex.load(__dirname,'jonfon');
const products     = model.products;


// model.neighbors('739049451726747',10).forEach(neighbor=>{
//   let user=customers.find(customer=>customer.id==neighbor.user)||{};
//   let udx=customers.findIndex(customer=>customer.id==neighbor.user);
//   console.log('- neighbors Delf',neighbor.user, udx,user.pseudo,neighbor.similarity);
//   // model.ratings(customers[udx].id,10).forEach(rating=>{
//   //   console.log('-  ',rating.item,products.find(p=>p.sku==rating.item).title,rating.score.toFixed(4));
//   // });
  
// });

// 'produits-laitiers' 'fruits-legumes'
let category='bieres-champagnes-et-plus';//=


// model.recommendations('anonymous',30).forEach(recommend=>{
//   console.log('- recommendations anonymous',products.find(p=>p.sku==recommend.item).title,recommend.score);
// })


// model.recommendations('739049451726747',10,{category:category}).forEach(recommend=>{
//   console.log('- recommendations Delf',recommend.item, products.find(p=>p.sku==recommend.item).title,recommend.score);
// });



console.log('---- 739049451726747', (Date.now()-time),'ms');time=Date.now();

model.ratings('739049451726747',15,{category:category}).forEach(elm=>{
  let prod=model.products.find(p=>p.sku==elm.item);
  console.log('    ',elm.score.toFixed(2),elm.sum,prod.title,prod.sku);
});

console.log('---- anonymous', (Date.now()-time),'ms');time=Date.now();
model.ratings('anonymous',15,{category:category}).forEach(elm=>{
  let prod=model.products.find(p=>p.sku==elm.item);
  console.log('    ',elm.score.toFixed(2),elm.sum,prod.title,prod.sku);
});

const results={};
const cats=model.getCategories();
cats.forEach(cat=>{
  results[cat]=model.ratings('anonymous',260,{category:cat}).map(elm=>elm.item).sort();
  console.log('--- anonymous',cat,results[cat].length);
});

// Verify product belongs to ONE category 
cats.forEach((cat,i)=>{
  cats.forEach((testcat,j)=>{    
    if(i==j)return;
    // console.log('Testing ',cat,' with ',testcat)
    results[cat].forEach(sku=>{
      if(results[testcat].indexOf(sku)>-1) throw Error('Wrong INDEX');
    })
  })

});

cats.forEach(cat=>{
  results[cat]=model.ratings('2360346371241611',10,{category:cat,pad:true});

  console.log('--- user',cat,results[cat].length);
  results[cat].slice(0,8).forEach(elm=>{
    let prod=model.products.find(p=>p.sku==elm.item);
    // console.log('    ',elm.score.toFixed(2),elm.sum,prod.title);

  })
});

// model.ratings('739049451726747',30,{category:category}).forEach((rating,i)=>{
//   let prod=products.find(p=>p.sku==rating.item);
//   console.log('- rating Delf',i,rating.item,prod.title,prod.discount?'DISCOUNT':'',rating.score.toFixed(4));
// });

// console.log('----', (Date.now()-time),'ms');time=Date.now();

// model.ratings('anonymous',20,{category:category}).forEach(rating=>{
//   let prod=products.find(p=>p.sku==rating.item);
//   console.log('- rating anonymous:'+category||'',rating.item,prod.title,prod.discount?'DISCOUNT':'',rating.score.toFixed(4));
// });
// console.log('----', (Date.now()-time),'ms');time=Date.now();

// model.ratings('anonymous',20,{vendor:vendor}).forEach(rating=>{
//   let prod=products.find(p=>p.sku==rating.item);
//   console.log('- rating anonymous:'+vendor,rating.item,prod.title,prod.discount?'DISCOUNT':'',rating.score.toFixed(4));
// });
// console.log('----', (Date.now()-time),'ms');time=Date.now();

// machine.recommendedProducts(false,30).forEach(recommend=>{
//   console.log('- bests Delf',recommend.item, products.find(p=>p.sku==recommend.item).title,recommend.score);
// });