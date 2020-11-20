
import $products from './data/products.json';
import $orders from './data/orders.json';

import 'should';


//
// overload date
declare interface Date {
  plusDays : (nb: number) => Date;
}


(function () {
  Date.prototype.plusDays = function(nb: number) {
    const plus=new Date(this);
    plus.setDate(this.getDate()+nb);
    return plus;
  }
})();

describe('machine index real data for user 739049451726747', function() {
  this.timeout(5000);
  const Machine = require('../lib').Machine;
  const machine = new Machine({
    domain:'test',
  });

  let machineIndex;
  
  //
  // PUBLIC API
  const uid = 739049451726747;

  const producFilter = [
    {sku:1000018, label: '/** beurre */'},
    {sku:1001829, label: '/** lait */'},
    {sku:1000053, label: '/** baguette */'},
    {sku:1001861, label: '/** tomatte coeur */'},
    {sku:1002395, label: '/** pêche blanche */'},
    {sku:1002412, label: '/** pain levain*/'},
    {sku:1001884, label: '/** poire conférence*/'},
    {sku:1002028, label: '/** fruit passion */'}
  ];


  const mapSaves = async (iterable, action) => {
    let i=0;for (const x of iterable) {
      await action(x,i++);
    }
  }
  
  const betweeThan=(date,weeks)=>{
    let now=new Date();
    date = new Date(date);
    return date.plusDays(weeks*7)>now;
  }

  //
  // load a subset of all orders
  before(async () => {
  });


  it('create index for 739049451726747', async function() {
    const orders = ($orders as any[]).filter(order => order.customer.id === uid);
    const products = $products as any[];
    //
    //Traversing orders to find the distinct list of customers and products
    const customers = [uid];
    
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
        // initial score value
        let boost=item.quantity || item.qty;

        //
        // product boosters activated  product.boost
        boost=(product.boost)?(boost*5) : boost;

        //
        //boosters  discount
        boost=product.discount?(boost*5) : boost;

        //
        //boosters  user.likes
        if(order.customer.likes.indexOf(item.sku)>-1) {
          boost = (boost*2);
        }

        if(product.sku === 1002412){
          boost = (boost*10);
        }

        //
        // boosters NEW product.created < 8WEEK
        if(betweeThan(product.created,12)){
          // console.log('created before 8weeks',product.sku);
          boost=((boost)*10);
        } else
        //
        //boosters  product.updated < 2WEEK
        if(betweeThan(product.updated,3)){
          // console.log('updated before 3weeks',product.sku);
          boost=(boost*2);
        }


        // console.log('--learn uid',order.customer.id,'product',product.sku,'boost',boost);
        machine.learn(order.customer.id,product.sku,boost);  
      })
    });

    //
    // train
    machineIndex = machine.train();
        


  });

  // E**O//2360346371241611  C**D//739049451726747 M**R//1099354922508877  K**L 1847885976581568
  it('use index for user 739049451726747', async function() {
    const user = uid;
    const options = {
      pad:true
    };

    // 1000018, /** beurre */
    // 1001829, /** lait */
    // 1000053, /** baguette */
    // 1001861, /** tomatte coeur */
    // 1002395, /** pêche blanche */
    // 1002412, /** pain levain */
    // 1001884, /** poire conf */
    // 1002028, /** passion */

    const ratings = machineIndex.ratings(user,400,options).filter(rating => {
      return producFilter.some(elem => elem.sku === rating.item);
    });
    ratings.sort((a,b) => {
      return b.score-a.score
    }).forEach(rating => {
      console.log('user rating: ',producFilter.find(p=>p.sku == rating.item).label, rating.item,rating.score,rating.sum);
    });
    
  });


});