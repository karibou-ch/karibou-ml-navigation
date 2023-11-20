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
  groups;
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
  boost(product, factor) {    
    const sku=product.sku;    
    const category=product.categories;
    let row=this.ratings['anonymous'].findIndex(rate=>rate.item==sku);
    if(row<0){
      return console.log('-- ERROR missing product in anonymous index',sku);
    }


    console.log('- boost product',sku,factor);

    //
    // place the product in the average screen
    this.ratings['anonymous'][row].sum = 1;
    this.ratings['anonymous'][row].score = (this.maxScore[category]) * factor;

  }

  //
  // 
  setModel(users,products,orders){
    // Init row/col labels
    const cohorts = users.filter(user => user.plan && (user.plan.id||user.plan)).map(user => user.plan.id||user.plan);
    this.users = users.concat(cohorts,['anonymous']);
    this.orders=orders;
    this.products=products;

    // INIT Matrix
    // Array(9).fill().map(()=>Array(9).fill())
    this.matrix = [];
    for(var i=0; i<this.users.length; i++) {
        // FIXME remove fill(0) and use sparce matrix for faster computation  !!
        this.matrix[i] = new Array(this.products.length);
    }

    // this.ratings['anonymous']=this.products.map(product=>{
    //   return {
    //     item:product.sku,
    //     score:0.01,
    //     sum:0
    //   };
    // });

    // console.log('--DBG',this.ratings['anonymous'].length,this.products.length);
  }

  //
  // matrixCell('category','movie-name', 'user', 'score');
  // return matrix
  learn(user,product,qty, cluster){
    qty=qty||1;
    // https://github.com/raghavgujjar/matrix#readme
    assert(product);
    assert(user);
    const plen = this.products.length;
    const uid=user.id||user;
    const pid=product.sku||product;    
    const row=this.users.findIndex(user=>(user.id||user)==uid);
    const col=this.products.findIndex(product=>product.sku==pid);
    if(col<0){
      return console.log('-- ERROR missing product',pid);
    }

    if(row<0){
      return console.log('-- ERROR missing user',uid);
    }


    if(!this.matrix[row][col]){
      this.matrix[row][col]=0;
    }
    if(cluster) {
      this.matrix[row][col]= (this.matrix[row][col]+qty)/(cluster);
    }else {
      this.matrix[row][col]+=qty;          
    }
  }



  //
  // compute attenuation for one order 
  // result value 2;0,17 (after 24 month)
  attenuationByTime(when) {
    const today=Date.now();
    const onemonth=86400000*30;

    //
    // time lapse in months
    const timeInMonth=((today-when.getTime())/onemonth);

    //
    // compute attenuation
    // https://www.desmos.com/calculator/3yogioggkp?lang=fr
    //let boost=1/(Math.pow(timeInMonth+1,4)*0.15)+0.01;
    const boost=1/(Math.pow(timeInMonth+0.9,1)*1.8)+0.1;
    return boost;
  }



  //
  // index products by UID
  // user can be a cohort name (school, anon, etc.) or an uid
  index(uid){
    uid = uid.id||uid;

    //
    // total orders for this user (or user plan)
    let orders=this.orders.filter(o=> [o.customer.id,o.customer.plan].indexOf(uid)>-1);
    let rowuid=this.users.findIndex(user=>(user.id||user)==uid);

    console.log('---        index user',rowuid, uid, this.matrix[rowuid].length);
     
    this.ratings[uid]=this.matrix[rowuid].map((prodFreq,i)=>{

      //
      // use default value when prodFreq is undefined (case of sparce matric)
      prodFreq = prodFreq || 0.01;

      //
      // get product SKU
      const sku=this.products[i].sku;

      const category=this.products.find(product=>product.sku==sku).categories;


      // get attenuation(sum)
      let orderFreq = orders.filter(order=> order.items.some(item=>item.sku==sku)).length + 1;
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
      score=((prodFreq/orderFreq));  

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
    // sort user
    this.ratings[uid]=this.ratings[uid].filter(rating=>rating).sort((a,b)=>{
      return b.score-a.score;
    });
  
    //console.log('---        DBG rating for ',uid, this.ratings[uid]);

  }


  indexAnonymous(){

    //
    // anonymous score
    this.ratings['anonymous'] = this.products.map(product => ({
      score:0.01,
      sum:0,
      sku:product.sku
    }));
    
    // this.ratings[uid].forEach((elem,i)=>{
    //   let row=this.ratings['anonymous'].findIndex($elem=>$elem.item==elem.item);
    //   this.ratings['anonymous'][row].score= (this.ratings['anonymous'][row].score + elem.score) / 2;
    //   this.ratings['anonymous'][row].sum = (this.ratings['anonymous'][row].sum + elem.sum) / 2;
    // });


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

    return new MachineIndex({
      products:this.products,
      rating:this.ratings,
      model:this.model,
      domain:this.domain,
      timestamp: Date.now()
    });
  }

}

