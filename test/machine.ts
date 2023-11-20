
// minimal format for testing purposes
import $products from './data/products-xs.json';
import $orders from './data/orders-xs.json';


const MachineIndex = require('../lib').MachineIndex;
const MachineCreate = require('../lib').MachineCreate;
const orderToLeanObject = require('../lib').orderToLeanObject;
const productToLeanObject = require('../lib').productToLeanObject;
const dateBetweeThan = require('../lib').dateBetweeThan;

const machine = new MachineCreate({
  domain:'test'
});

//
//Traversing orders to find the distinct list of customers and products
const uniqCustomer = (elem, pos, arr) => {
  return arr.findIndex(cus => cus.id==elem.id) == pos;
}
const customers = $orders.map(order=>order.customer).filter(uniqCustomer);

const sortBySum = (a,b) => {
  return b.score-a.score;
}

import 'should';

describe('machine index', function() {
  this.timeout(5000);
  let machineIndex;
  before(async () => {

  });


  it('create index', async () => {    

    //
    // load JSON with FS to keep the same relative PATH !!
    // Only get orders for a specific domain
    // 
    //
    //- customer.id
    //- item.sku
    //- item.quantity
    //- order.customer.likes
    const orders = $orders.map(order=>orderToLeanObject(order));
    
    const products = $products.map(product => productToLeanObject(product));
    
    
    const indexOrders=async (products)=>{      
      
      machine.setModel(customers,products,orders);      
      //
      // BOOST content
      orders.forEach(order => {
        //
        // attenuation is a value  [0.15;2] => [24months;today]
        const attenuation = machine.attenuationByTime(order.shipping.when);
        order.items.forEach(item => {
      
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
          // product boosters activated  product.boost
          boost=(product.boost)?(boost*10) : boost;
    
          //
          //boosters  discount
          boost=product.discount?(boost*5) : boost;
      
                    //
          // boosters NEW product.created < 8WEEK
          if(dateBetweeThan(product.created,8)){
            boost=((boost)*4);
            console.log('created before 8weeks',product.sku, boost);
          } else
          //
          //boosters  product.updated < 2WEEK
          if(dateBetweeThan(product.updated,4)){        
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
            machine.learn(plan,product.sku,boost, 10);   
          }
          //
          // learn for anonymous (only when it's a customer)
          machine.learn('anonymous',product.sku,boost, 10);   
        })
      });
    
    
      
      console.log('- taining (products,orders)',products.length,orders.length);
      machineIndex = machine.train();

      //
      // product not indexed (means never buyed)
      products.filter(product => !product.indexed).forEach(product => {
        const factor = machine.attenuationByTime(product.created);
        machine.boost(product,factor);   
      });
    
      console.log('- taining done','all rating products');

    }
    
    indexOrders(products)
      

  });

  it('machine index for anonymous', async function() {
    const ratings = machineIndex.ratings('anonymous',200);
    ratings.length.should.not.equal(0)
  });

  //
  // 1. first more buyed item 1, 
  // 2. boosted new product item 5, 
  // 3. second more buyed item 1, 
  // 4. item 3 is common score (anonymous)
  it('use index for user 1 without padding', async function() {
    const user = 1;
    const options = {
      pad:false
    };
    const ratings = machineIndex.ratings(user,200,options);
    ratings.length.should.equal(3);
    console.log('user 1 rating: ',ratings.sort(sortBySum))
  });

  it('use index for user 2 without padding', async function() {
    const user = 2;
    const options = {
      pad:false
    };
    const ratings = machineIndex.ratings(user,200,options);
    ratings.length.should.equal(3);
    console.log('user 2 rating: ', ratings.sort(sortBySum))

  });

  it('use index for cool without padding', async function() {
    const user = 'cool';
    const options = {
      pad:false
    };
    const ratings = machineIndex.ratings(user,200,options);
    ratings.length.should.equal(3);
    console.log('user cool rating: ', ratings.sort(sortBySum))

  });

  it('use index for cool with padding', async function() {
    const user = 'cool';
    const options = {
      pad:true
    };
    const ratings = machineIndex.ratings(user,200,options);
    ratings.length.should.equal(5);
    console.log('user cool rating: ', ratings.sort(sortBySum))

  });

  it('use index for anonymous', async function() {
    const user = 'anonymous';
    const options = {
    };
    const ratings = machineIndex.ratings(user,200,options);
    console.log('user anonymous rating: ', ratings.sort(sortBySum))
    ratings.length.should.equal(5);

  });

  it('use index for user 1 and one HUB (set of vendors)', async function() {
    const user = 1;
    const options = {
      vendors:['b','c'],
      pad:true
    };
    const ratings = machineIndex.ratings(user,200,options);
    console.log('user 1 in HUB rating (set of vendors [b,c]): ',ratings.sort(sortBySum))
  });

  it('use index for user 1 and one category', async function() {
    const user = 1;
    const options = {
      category:'c1',
      pad:true
    };
    const ratings = machineIndex.ratings(user,200,options);
    console.log('user 1 in C1 rating: ',ratings.sort(sortBySum))
  });

});