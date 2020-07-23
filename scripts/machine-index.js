const Machine = require('../dist').Machine;
const machine = new Machine({
  domain:'jonfon',
  _likely:true
});

const findOrders=(customer)=>{
  return (order)=>{return order.customer.id=customer.id};
};
const orders = require('../test/data/orders.json');
const products = require('../test/data/products.json').filter(product=>{
  // fruits-legumes produits-laitiers
  // return product.categories=='fruits-legumes';
  // return product.categories=='produits-laitiers';
  return true;
});


// const betweeThan=(date,weeks)=>{
//   let now=new Date();
//   date = new Date(date);
//   return date.plusDays(weeks*7)>now;
// }


//
//Traversing orders to find the distinct list of customers and products
const customers = orders.map(order=>order.customer.id).filter((elem, pos, arr) => {
  return arr.indexOf(elem) == pos;
});


//products = products.slice(0, 50)
// E**O//2360346371241611  C**D//739049451726747 M**R//1099354922508877  K**L 1847885976581568
machine.setModel(customers,products,orders);

orders.forEach(order => {
	order.items.forEach(item => {

    let product=products.find(product=>product.sku==item.sku);
    if(!product||!product.sku){
      return;
    }

    let boost=item.quantity;

    //
    //boosters  product.boost
    boost=product.boost&&((boost)*10);

    //
    //boosters NEW product.created < 6WEEK
    // if(betweeThan(product.created,8)){
    //   console.log('created before 6weeks',product.title);
    //   boost=((boost)*10);
    // }


    //
    //boosters  discount
    boost=product.discount&&(boost*10)||boost;
    //
    //boosters  user.likes
    boost=(order.customer.likes.indexOf(item.sku)>-1)&&(boost*5)||boost;
  
    machine.learn(order.customer.id,product.sku,item.quantity);

    //
    // anonymous user
    // machine.learn('anonymous',product.sku,boost);

	})
});

console.log('- taining (products,orders)',products.length,orders.length);
machine.train().save(__dirname).then((index)=>{
  console.log('- taining done');

  // console.log('----C**D','739049451726747');
  // index.ratings('anonymous',500).forEach(elem=>{
  //   console.log('----',elem.item,elem.score,elem.sum);
  // })
  
  
});


