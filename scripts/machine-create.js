const MachineIndex = require('../dist').MachineIndex;
const MachineCreate = require('../dist').MachineCreate;

const fs = require('fs');


const machine = new MachineCreate({
  domain:'test'
});


//
// load JSON with FS to keep the same relative PATH !!
// Only get orders for a specific domain
// 
//
//- customer.id
//- item.sku
//- item.quantity
//- order.customer.likes
const orders = require('../test/data/orders-xs.json')
                .map(order=>machine.orderToLeanObject(order));


const products = require('../test/data/products-xs.json').filter(product=>{
  // fruits-legumes produits-laitiers
  // return product.categories=='fruits-legumes';
  // return product.categories=='produits-laitiers';
  return true;
}).map(product => machine.productToLeanObject(product));


const betweeThan=(date,weeks)=>{
  let now=new Date();
  date = new Date(date);
  return machine.datePlusDays(date,weeks*7)>now;
}

const indexOrders=async (products)=>{
  
    
  //
  //Traversing orders to find the distinct list of customers and products
  const customers = orders.map(order=>order.customer.id).filter((elem, pos, arr) => {
    return arr.indexOf(elem) == pos;
  });
  
  
  
  // E**O//2360346371241611  C**D//739049451726747 M**R//1099354922508877  K**L 1847885976581568
  machine.setModel(customers,products,orders);
  
  //
  // BOOST content
  orders.forEach(order => {
    order.items.forEach(item => {
      //
      // attenuation is a value  [0.15;2] => [24months;today]
      const attenuation = machine.attenuationByTime(order.shipping.when);
      const product=products.find(product=>product.sku==item.sku);
      if(!product||!product.sku){
        return;
      }

      //
      // mark this product indexed
      product.indexed = true;

      //
      // initial score value
      let boost=(+item.qty || +item.quantity);


      //
      // FIXME boosters  user.likes
      // if(order.customer.likes.indexOf(item.sku)>-1) {
      //   boost = (boost*5);
      // }
      

      //
      // boosters NEW product.created < 8WEEK
      if(betweeThan(product.created,8)){
        boost=((boost)*4);
        console.log('created before 8weeks',product.sku, boost);
      } else
      //
      //boosters  product.updated < 2WEEK
      if(betweeThan(product.updated,4)){        
        boost=(boost*2);
        // console.log('updated before 3weeks',product.sku, boost);
      } else 
      //
      //boosters for discount or paid boost
      if(product.boost||product.discount){
        boost=(product.boost)?(boost*4) : boost;
        boost=product.discount?(boost*2) : boost;
      }

      //
      // finaly apply attenutation
      boost = attenuation * boost;

      //
      // learn for customer
      machine.learn(order.customer.id,product.sku,boost);   
      //
      // learn for named group of customer
      const plan = order.customer.plan;
      if(plan) {
        machine.learn(plan,product.sku,boost);   
      }
      //
      // learn for anonymous
      machine.learn('anonymous',product.sku,boost);   
    })
  });

  
  console.log('- taining (products,orders)',products.length,orders.length);
  const index = machine.train();

  //
  // product not indexed (means never buyed) 
  // they have a boosted time
  products.filter(product => !product.indexed).forEach(product => {
    const factor = machine.attenuationByTime(product.created);
    machine.boost(product,factor);   
  });

  await index.save('./');
  console.log('- taining done','all rating products');

  //
  // get all rating products
  const ratings = index.ratings('anonymous',5000);
  ratings.forEach(rate => {
    prod = products.find(p=>p.sku==rate.item);
    console.log(rate.score+','+prod.sku+','+prod.created);
  });


  console.log('FIN'); 
  process.exit(0);    
}
  



indexOrders(products)

