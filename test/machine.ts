
import $products from './data/products-subset.json';
import $orders from './data/orders-subset.json';

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

describe('machine index', function() {
  this.timeout(5000);
  const Machine = require('../lib').Machine;
  const machine = new Machine({
    domain:'test',
  });

  let machineIndex;
  
  //
  // PUBLIC API

  const toObject=(product)=>{
    const shop=product.vendor;
    const natural=product.details.bio||
                product.details.natural||
                product.details.biodynamics||
                product.details.bioconvertion;
    const category = product.categories ? product.categories.slug:'undefined';
    return {
      sku:product.sku,
      categories: category,
      vendor: shop.urlpath?shop.urlpath:shop,
      created:product.created,
      updated:product.updated,
      discount:product.attributes.discount,
      boost: product.attributes.boost,
  
      // title:product.title,
      // slug:product.slug,
      // photo:product.photo.url,
      // created:product.created,
      // updated:product.updated,
      // discount:product.attributes.discount,
      // boost: product.attributes.boost,
      // natural:natural,
      // local:product.details.local  
    }
  }
  
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
  // before(async () => {
  //   const subsetFile = '/data/orders-subset.json';
  //   const fs = require('fs');
  //   if (fs.existsSync(__dirname +subsetFile)) {
  //     $orders = require('.'+subsetFile);
  //     return;
  //   }
  //   const itemMap = (item) => {
  //     return {
  //       sku:item.sku,
  //       vendor:item.vendor,
  //       qty:item.qty,
  //       category:item.category,
  //     };
  //   };

  //   const orders: any[] = require('./data/orders.json');
  //   $orders = orders.sort(() => .5 - Math.random()).slice(0,10).map(order => {      
  //     const shipping = order.shipping;
  //     shipping.when = shipping.when.$date || shipping.when;
  //     return {
  //       oid: order.oid,
  //       shipping: shipping,
  //       customer: order.customer,
  //       items: order.items.map(itemMap)
  //     }
  //   })

  //   fs.writeFileSync(__dirname + subsetFile, JSON.stringify($orders, null , 2 ), { flag:'w' });

  // });

  //
  // load a subset of all orders
  before(async () => {
    const now = new Date();
    //
    // product 4 is updated
    $products[4].updated = (now.plusDays(-10).toISOString())

    //
    // product 7 and 8 are new
    $products[6].created = (now.plusDays(-10).toISOString())
    $products[7].created = (now.plusDays(-1).toISOString())

  });


  it('create index', async function() {
    const orders = $orders as any[];
    const products = $products as any[];
    //
    //Traversing orders to find the distinct list of customers and products
    const customers = orders.map(order=>order.customer.id).filter((elem, pos, arr) => {
      return arr.indexOf(elem) == pos;
    });
    
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
        let boost=item.quantity;

        //
        // product boosters activated  product.boost
        boost=(product.boost)?(boost*2) : boost;

        //
        //boosters  discount
        boost=product.discount?(boost*2) : boost;

        //
        //boosters  user.likes
        if(order.customer.likes.indexOf(item.sku)>-1) {
          boost = (boost*2);
        }
        

        //
        // boosters NEW product.created < 8WEEK
        if(betweeThan(product.created,8)){
          // console.log('created before 8weeks',product.sku);
          boost=((boost)*2);
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
  it('use index for user 5', async function() {
    const user = 5;
    const options = {
      pad:true
    };
    const ratings = machineIndex.ratings(user,200,options);
    console.log(ratings)
  });

  it('use index for user 15', async function() {
    const user = 15;
    const options = {
      pad:true
    };
    const ratings = machineIndex.ratings(user,200,options);

  });

});