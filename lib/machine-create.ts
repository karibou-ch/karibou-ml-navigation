import { strict as assert } from 'assert';
import { MachineIndex } from './machine-index';

//
// Create new score on product for each customer
// Anonymous user is the average score of all users
//

//
// vector, matrix and geometry library
// http://sylvester.jcoglan.com/

export class MachineCreate{

  options;
  today;
  domain;
  file;
  approach;
  users;
  orders;
  products;
  matrix;
  model;
  ratings;
  engine;
  maxScore;
  minScore;
  initialBoost;

  constructor(options){
    this.options=options||{};

    // output classification
    this.today=new Date();


    // model
    this.domain=this.options.domain||'karibou.ch';
    this.file="-model.json";
    this.users=[];
    this.orders=[];
    this.products=[];
    this.matrix=[];
    this.model;
    this.ratings={};
    this.maxScore = {};
    this.minScore = {};
    this.initialBoost = {};
  }

  orderToLeanObject(order){
    const obj = {
      customer: {
        id:order.customer.id,
        likes:order.customer.likes
      },
      items:order.items,
      shipping:{
        when:(order.shipping.when.$date? new Date(order.shipping.when.$date): new Date(order.shipping.when))
      }
    }
    return obj;
  }

  productToLeanObject(product){
    const isLean = !product.details;
    const shop=isLean ? (product.vendor||''):(product.vendor.urlpath ? product.vendor.urlpath: product.vendor);
    const natural=isLean ? false: product.details.bio||
                product.details.natural||
                product.details.biodynamics||
                product.details.bioconvertion;
    const category = isLean? product.categories:(product.categories ? product.categories.slug:'orphan');
    const obj={
      sku:product.sku,
      categories: category,
      vendor: shop,
      created:product.created,
      updated:product.updated,
      discount:(isLean?product.discount:product.attributes.discount),
      boost: (isLean?product.boost:product.attributes.boost),
      natural:natural
      // title:product.title,
      // slug:product.slug,
      // photo:product.photo.url,
      // natural:natural,
      // local:product.details.local  
    };
    return obj;
  }

  datePlusDays=function(date,nb) {
    var plus=new Date(date);
    plus.setDate(date.getDate()+nb);
    return plus;
  }

  

  getRatings(uid){
    assert(uid);
    let row=this.users.findIndex(id=>id==uid);
    // this.model.ratings(uid)  

    return this.matrix[row].map((col,i)=>{
      return {
        item:this.products[i].sku,score:col
      }
    }).sort((a,b)=>{
      return b.score-a.score;
    });
  }


  //
  // Helper to index and boost new products that arent yet been purchased
  boost(product) {    
    const sku=product.sku;    
    const category=product.categories;
    let row=this.ratings['anonymous'].findIndex(rate=>rate.item==sku);
    if(row<0){
      return console.log('-- ERROR missing product in anonymous index',sku);
    }

    const factor = (product.boost)? .9 : (product.discount)? .5 : 0.25;

    console.log('- boost product',sku,factor);

    //
    // place the product in the average screen
    this.ratings['anonymous'][row].sum = 1;
    this.ratings['anonymous'][row].score = (this.maxScore[category]) * factor;

  }

  //
  // matrixCell('category','movie-name', 'user', 'score');
  // return matrix
  learn(user,product,qty){
    qty=qty||1;
    // https://github.com/raghavgujjar/matrix#readme
    assert(product);
    assert(user);
    let uid=user.id||user;
    let pid=product.sku||product;    
    let row=this.users.findIndex(id=>id==uid);
    let col=this.products.findIndex(product=>product.sku==pid);
    if(col<0){
      return console.log('-- ERROR missing product',pid);
    }

    if(row<0){
      return console.log('-- ERROR missing user',uid);
    }


    if(!this.matrix[row][col]){
      this.matrix[row][col]=0;
    }
    
    this.matrix[row][col]+=qty;    
  }


  //
  // 
  setModel(users,products,orders){
    // Init row/col labels
    this.users=users;
    this.orders=orders;
    this.products=products;

    // INIT Matrix
    // Array(9).fill().map(()=>Array(9).fill())
    this.matrix = [];
    for(var i=0; i<this.users.length; i++) {
        // FIXME remove fill(0) and use sparce matrix for faster computation  !!
        this.matrix[i] = new Array(this.products.length);
    }

    this.ratings['anonymous']=this.products.map(product=>{
      return {
        item:product.sku,
        score:0.01,
        sum:0
      };
    });

    // console.log('--DBG',this.ratings['anonymous'].length,this.products.length);
  }


  //
  // compute attenuation by time
  // -https://www.desmos.com/calculator/3yogioggkp?lang=fr
  dimmerSum(orders,sku){
    let today=Date.now();
    let onemonth=86400000*30;

    //
    // for each orders
    let score=orders.filter(order => order.items.some(item=>item.sku==sku)).reduce((sum,order)=>{
      //
      // get order date
      const when = order.shipping.when;

      //
      // count sku (item freq) vs items count
      let countBuy=order.items.filter(item=>item.sku==sku).length;

      //
      // time lapse in months
      let timeInMonth=((today-when.getTime())/onemonth);

      //
      // compute attenuation
      let boost=1/(Math.pow(timeInMonth+1.0,4)*0.15)+0.01;

    // if(sku==1002028){
    //   console.log('- attenuation',timeInMonth.toFixed(2), boost.toFixed(2), countBuy,sum); //countBuy,countBuy*boost+sum,
    // }

      return countBuy*boost+sum;
    },0);
    return score;
  }



  //
  // index products by 
  // log(Fp)*|p€O|/|O|
  // dimming is made when calling learn(...)
  index(uid){
    //
    // grouped is a trick to create similarities of UID (example for business users)
    let grouped = Object.keys(this.options.groups ||{}).find(key => {
      return this.options.groups[key].indexOf(uid) >-1;
    });
    let grouped_uid = grouped ?  this.options.groups[grouped]: [uid];

    //
    // total orders for this user (or group of users)
    let orders=this.orders.filter(o=> grouped_uid.indexOf(o.customer.id)>-1);
    let rowuid=this.users.findIndex(id=>id==uid);

    console.log('---        index user',rowuid);
     
    this.ratings[uid]=this.matrix[rowuid].map((prodFreq,i)=>{

      //
      // use default value when prodFreq is undefined (sparce matric)
      prodFreq = prodFreq || 0.01;

      //
      // get product SKU
      const sku=this.products[i].sku;
      const category=this.products.find(product=>product.sku==sku).categories;


      // get attenuation(sum)
      let orderItemCount = orders.filter(order=> order.items.some(item=>item.sku==sku)).length + 1;
      let dimmedSum=this.dimmerSum(orders,sku);
      //  
      // compute the score
      let score=0.0;

      //
      // case of new products, or updated product
      //

      //
      // https://github.com/karibou-ch/karibou-ml-userx/
      // CU : nombre total de commandes pour un utilisateur
      // CUp: nombre de commandes de l'utilisateur où le produit p_{i} apparaît      

      // ∑O    => count orders for one user
      // ∑(p ⊂ O)  => count orders for one product
      // fP     => frequency product for all orders (freq is >= of p⊂O)
      // log(CUp x Fa)/ CU x Fp
      if(prodFreq && orders.length){
        score=(dimmedSum*(prodFreq/orderItemCount));  
      }

      // 
      // the roof of max score 
      if(!this.maxScore[category]){
        this.maxScore[category] = -1;
      }

      // 
      // the roof of max score 
      if(!this.minScore[category]){
        this.minScore[category] = 1;
      }
     
      //
      // normalize score inside the same category
      if(score > this.maxScore[category]) {
        this.maxScore[category] = score; 
      }
  
      if(score < this.minScore[category]) {
        this.minScore[category] = score;
      }  
  
      return {
        item:sku,
        score:score,
        sum:prodFreq||0
      }
    });

    

    //
    // anonymous score
    this.ratings[uid].forEach((elem,i)=>{
      let row=this.ratings['anonymous'].findIndex($elem=>$elem.item==elem.item);
      this.ratings['anonymous'][row].score= (this.ratings['anonymous'][row].score + elem.score) / 2;
      this.ratings['anonymous'][row].sum = (this.ratings['anonymous'][row].sum + elem.sum) / 2;
    });

    //
    // sort user
    this.ratings[uid]=this.ratings[uid].filter(rating=>rating).sort((a,b)=>{
      return b.score-a.score;
    });
  
  }


  indexAnonymous(){
    // make sure anonymous doesn't outperform any uid
    this.ratings['anonymous']=this.ratings['anonymous'].map(elem=>{
      elem.score=elem.score/2;
      return elem;
    }).sort((a,b)=>{
      return b.score-a.score;
    });

    // [0,1,2,3,4,5,6].forEach(i=>{
    //   console.log('----- anonyous',this.ratings['anonymous'][i].score,this.ratings['anonymous'][i].item)
    // });
  }

  train(){
    console.log('--- build users')
    this.users.forEach(this.index.bind(this));
    console.log('--- build anonymous')
    this.indexAnonymous();

    return new MachineIndex({
      products:this.products,
      rating:this.ratings,
      model:this.model,
      domain:this.domain,
      timestamp: Date.now()
    });
  }

}

