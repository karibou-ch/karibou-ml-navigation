
import $products from './data/products-xs.json';
import $orders from './data/orders-xs.json';


const MachineIndex = require('../lib').MachineIndex;
const MachineCreate = require('../lib').MachineCreate;

const machine = new MachineCreate({
  domain:'test'
});

//
//Traversing orders to find the distinct list of customers and products
const customers = $orders.map(order=>order.customer.id).filter((elem, pos, arr) => {
  return arr.indexOf(elem) == pos;
});
  
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
    const orders = $orders.map(order=>machine.orderToLeanObject(order));
    
    const products = $products.map(product => machine.productToLeanObject(product));
    
    
    const betweeThan=(date,weeks)=>{
      let now=new Date();
      date = new Date(date);
      return machine.datePlusDays(date,weeks*7)>now;
    }
    
    const indexOrders=async (products)=>{      
      
      machine.setModel(customers,products,orders);
      
      //
      // BOOST content
      orders.forEach(order => {
        order.items.forEach(item => {
    
          let product=products.find(product=>product.sku==item.sku);
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
          //boosters  user.likes
          if(order.customer.likes.indexOf(item.sku)>-1) {
            boost = (boost*5);
          }
          
    
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
          }
    
          // console.log('--learn uid',order.customer.id,'product',product.sku,'boost',boost);
          machine.learn(order.customer.id,product.sku,boost);   
        })
      });
    
    
      
      console.log('- taining (products,orders)',products.length,orders.length);
      machineIndex = machine.train();

      //
      // product not indexed (means never buyed)
      products.filter(product => !product.indexed).forEach(product => {
        const newProduct = betweeThan(product.created,4);
        if(product.discount || product.boost || newProduct){
          machine.boost(product);   
        }
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
  it('use index for user 1', async function() {
    const user = 1;
    const options = {
      pad:true
    };
    const ratings = machineIndex.ratings(user,200,options);
    console.log('user 1 rating: ',ratings.sort(sortBySum))
  });

  it('use index for user 2', async function() {
    const user = 2;
    const options = {
      pad:true
    };
    const ratings = machineIndex.ratings(user,200,options);
    console.log('user 2 rating: ', ratings.sort(sortBySum))

  });



  it('use index for anonymous', async function() {
    const user = 'anonymous';
    const options = {
      pad:true
    };
    const ratings = machineIndex.ratings(user,200,options);
    console.log('user anonymous rating: ', ratings.sort(sortBySum))

  });

  it('use index for user 1 and one HUB (set of vendors)', async function() {
    const user = 1;
    const options = {
      vendors:['b','c'],
      pad:true
    };
    const ratings = machineIndex.ratings(user,200,options);
    console.log('user 1 in HUB rating: ',ratings.sort(sortBySum))
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