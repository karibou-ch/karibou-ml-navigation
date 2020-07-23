import products from './data/products.json';
import orders from './data/orders.json';

import 'should';

describe('orders index', function() {

  this.timeout(5000);
  let categoryFilter='';
  let best={};
  let scored={};

  let selectOrder=(uid, cat)=>{
    let selected=orders.filter(o=>o.customer.id=='739049451726747');
    // selected.forEach(order=>{
    //   order.items=order.items.filter(item=>item.category.toLowerCase().indexOf(categoryFilter)>-1);
    // });
    return selected;
  }

  let filterByCategory=(sku)=>{
    let product=products.find(p=>p.sku==sku);
    if(!product){
      return false;
    }
    return product.categories.indexOf('fruits')>-1;
  }

  let getBest=(map)=>{
    return Object.keys(map).sort((a,b)=>{
      return map[b]-map[a];
    });
  }

  // E**O//2360346371241611  C**D//739049451726747 M**R//1099354922508877  K**L 1847885976581568
  it('abs count of prefered  for C**D', function(done) {
    selectOrder('739049451726747',categoryFilter).forEach(order=>{
      order.items.forEach(item=>{
        best[item.sku]=best[item.sku]||0;
        best[item.sku]+=item.qty;
      });
    })

    //
    // verify bests >=10 orders
    getBest(best).filter(filterByCategory).filter((elm,i)=>i<15).forEach((sku,i)=>{
      let product=products.find(p=>p.sku==sku);
      console.log('-- ',i+1,best[sku],product.title);
    })
    done();
  });

  //
  // scoring product in all orders
  // log(Fp)*|p€O|/|O|
  // |O|    => count orders for one user (orders.length)
  // p € O  => count orders for one product 
  // fP     => count (freq) product for all orders (freq is >= of p€O)
  // This scoring function take care of the buys distribution in multiple orders! (eg. one massive order of 10000 bread in one order!)
  it('objective count of prefered fromages',function(done){
    let countO={}; 
    let fP={}; 

    //
    // 1. count order for one user
    let orders=selectOrder('739049451726747',categoryFilter);

    //
    // 2. count order for each products
    getBest(best).forEach(sku=>{
      countO[sku]=orders.reduce((sum,order)=>{
        if(order.items.filter(item=>item.sku==sku).length){
          return sum+1;
        }
        return sum;
      },0);
      // let product=products.find(p=>p.sku==sku);
      // console.log('-- ',countO[sku],product.title);
    });

    //
    // 2. frequency for each products
    getBest(best).forEach(sku=>{
      fP[sku]=orders.reduce((sum,order)=>{
        return sum+order.items.filter(item=>item.sku==sku).reduce((sum,item)=>sum+item.qty,0);
      },0)||0;
    });

    //
    // 3. scoring product
    getBest(best).forEach(sku=>{
      // console.log('countO',countO[sku],'orders',orders.length,'fP',fP[sku])
      scored[sku]=(countO[sku]||1)/(orders.length)*Math.log(fP[sku]);  
    });    


    getBest(scored).filter(filterByCategory).filter((elm,i)=>i<15).forEach((sku,i)=>{
      let product=products.find(p=>p.sku==sku);
      console.log('-- ',i+1,scored[sku].toFixed(2),product.title);
    })

    done();
  });

  //
  // get the count of orders that contains the product
  // the sum of the orders is attenuated by the time (in month)
  // booster = 1/ ( timeInMonth + 2)^0.6 x 1 / 0.3 - 0.2
  it('abs count of prefered fromages attenuated by ellapsed time',function(done){
    let attenuated={};
    let today=Date.now();
    let onemonth=86400000*30;
    console.log('today',today);
    let orders=selectOrder('739049451726747',categoryFilter);
    let dimmer=(sku)=>{
      return orders.reduce((sum,order)=>{
        let countBuy=order.items.filter(item=>item.sku==sku).length;
        let timeInMonth=Math.round((today-(new Date(order.shipping.when.$date).getTime()))/onemonth);
        let boost=1/(Math.pow(timeInMonth+2,0.8)*0.18)-0.2;
        // if(sku==1001072&&countBuy){
        //   console.log('- boost',timeInMonth,countBuy,boost.toFixed(2),(countBuy*boost+sum).toFixed(2))
        // }
        return countBuy*boost+sum;
      },0);
    }

    getBest(scored).forEach(sku=>{
      attenuated[sku]=dimmer(sku);
    });

    //
    // verify attenuated >=10 orders
    getBest(attenuated).filter(filterByCategory).filter((elm,i)=>i<15).forEach((sku,i)=>{
      let product=products.find(p=>p.sku==sku);
      console.log('-- ',sku,i+1,attenuated[sku].toFixed(2),product.title);
    })


    done();
  });


});