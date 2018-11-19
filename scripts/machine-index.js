const Machine = require('../lib/machine');
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

	
//
//Traversing orders to find the distinct list of customers and products
const customers = orders.map(order=>order.customer.id).filter((elem, pos, arr) => {
  return arr.indexOf(elem) == pos;
});

// customer.push('anonymous');

//
// array of orders indexed by user id
const customer_orders=customers.map(user=>orders.filter(order=>order.customer.id==user));

// fake user
// customers.push('anonymous');

// "updated": "2018-06-19T09:46:11.166Z",
// "discount": false,
// "categories": "boucherie-et-charcuterie",
// "natural": true,
// "local": true
const findProduct=(sku)=>{

}

//products = products.slice(0, 50)
// E**O//2360346371241611  C**D//739049451726747 M**R//1099354922508877  K**L 1847885976581568
machine.setModel(customers,products,customer_orders);

orders.forEach(order => {
	order.items.forEach(item => {

    let product=products.find(product=>product.sku==item.sku);
    if(!product||!product.sku){
      return;
    }

    let boost=item.quantity;
    //
    //boosters // discount
    boost=product.discount&&(boost+item.quantity*2)||boost;
    //boosters // user.likes
    boost=(order.customer.likes.indexOf(item.sku)>-1)&&(boost+item.quantity*2)||boost;

    boost=product.boost&&(boost*10);

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


