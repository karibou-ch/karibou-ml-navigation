
// minimal format for testing purposes
require('should');
const $products =require ('./data/products-xs.json');
const $orders =require ('./data/orders-xs.json');


const MachineIndex = require('../dist').MachineIndex;
const MachineCreate = require('../dist').MachineCreate;
const orderToLeanObject = require('../dist').orderToLeanObject;
const productToLeanObject = require('../dist').productToLeanObject;
const dateBetweeThan = require('../dist').dateBetweeThan;

const machine = new MachineCreate({
  domain:'test',debug:1
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


describe('machine index testing filters', function() {
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

      const preparedOrders = machine.preparedOrders;

      const normalize = preparedOrders.length / customers.length;
    
  
      //
      // BOOST content
      preparedOrders.forEach(order => {
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
          if(order.customer.plan) {
            machine.learn(order.customer.plan,product.sku,boost, normalize);   
          }
          //
          // learn for anonymous (only when it's a customer)
          machine.learn('anonymous',product.sku,boost, normalize);   
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

  // c1 == A,B
  xit('list categories', async function() {
    machineIndex.categoriesList.forEach(cat =>{
      console.log('## ',cat,'\n --',machineIndex.getCategorySku(cat));
    })
    
  });

  // v1 == A, B, C, D, E
  // v2 == F
  xit('list vendors', async function() {    
    machineIndex.vendorsList.forEach(vendor =>{
      console.log('## ',vendor,'\n --',machineIndex.getVendorSku(vendor));
    })
    console.log('All vendors ',machineIndex.getVendorSku(machineIndex.vendorsList));

  });


  //
  // 1. get rating for user 1, 
  // 2. filtered by c1 & v1
  // 3. result = A,B
  it('use index for user 1 for c1 + v1:', async function() {
    const user = 1;
    const options = {
      pad:false,
      category:'c1',
      vendors:['v1','v3']
    };
    const ratings = machineIndex.ratings(user,200,options).map(e => e.item);
    console.log('user 1 for c1 + v1: ',ratings)
    ratings.length.should.equal(2);
  });

  it('use index for user 1 for c1 + v2:', async function() {
    const user = 1;
    const options = {
      pad:false,
      category:'c1',
      vendors:['v2','v3']
    };
    const ratings = machineIndex.ratings(user,200,options).map(e => e.item);
    console.log('user 1 for c1 + v2: ',ratings)
    ratings.length.should.equal(0);
  });


  //
  // 1. get rating for user 1, 
  // 2. filtered by c2 & v2
  it('use index for user 1 for c2 + v2:', async function() {
    const user = 1;
    const options = {
      pad:false,
      category:'c2',
      vendors:['v2','v3']
    };
    const ratings = machineIndex.ratings(user,200,options).map(e => e.item);
    console.log('user 1 for c1 + v1: ',ratings)
    ratings.length.should.equal(1);
    ratings[0].should.equal('F')
  });

  //
  // 1. get rating for user 1, 
  // 2. filtered by c2 & v2 & padding
  // 3. result = F
  it('use index for user 1 with padding', async function() {
    const user = 1;
    const options = {
      pad:true,
      category:'c2',
      vendors:['v2','v3']
    };
    const ratings = machineIndex.ratings(user,200,options).map(e => e.item);
    console.log('user 1 for c1 + v2 + v3:: ',ratings)
    ratings.length.should.equal(1);
  });  
});