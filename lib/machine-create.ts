import { strict as assert } from 'assert';
import { MachineIndex } from './machine-index';

//
// Create new score on product for each customer
// Anonymous user is the average score of all users
//


export class MachineCreate{

  options;
  today;
  domain;
  file;
  users;
  cohorts;
  groups;
  orders;
  products;
  matrix;
  model;
  ratings;
  maxScore;
  minScore;
  attenuation;
  categoriesWeight;
  debug;

  path;

  constructor(options){
    this.options=options||{};

    // output classification
    this.today=new Date();


    // model
    this.attenuation = {
      fA:options.fA||0.9,
      fB:options.fB||1,
      fC:options.fC||2.5,
      fD:options.fD||0.1
    }
    this.debug = options.debug;
    this.domain=this.options.domain||'karibou.ch';
    this.file="-model.json";
    this.users=[];
    this.cohorts = [];
    this.orders=[];
    this.products=[];
    this.matrix=[];
    this.model;
    this.ratings={};
    this.maxScore = {};
    this.minScore = {};
    this.categoriesWeight = [];    

    this.path = options.path;
  }

  get preparedOrders() { return this.orders;}

  //
  // Helper to index and boost new products that arent yet been purchased
  boost(product, factor) {    
    const sku=product.sku;    
    const category=product.categories;
    let row=this.ratings['anonymous'].findIndex(rate=>rate.item==sku);
    if(row<0){
      return this.debug && console.log('-- ERROR missing product in anonymous index',sku);
    }


    this.debug && console.log('- boost product',sku,factor);

    //
    // place the product in the average screen
    this.ratings['anonymous'][row].sum = 1;
    this.ratings['anonymous'][row].score = (this.maxScore[category]/2) * factor;
    if(Number.isNaN(this.ratings['anonymous'][row].score)) {
      console.log('--- DBG error boost score == NaN',sku,'anonymous',this.maxScore[category],factor );
    }
  
  }

  //
  // 
  setModel(users,products,orders){
    // Init row/col labels
    const plans = (global.config && global.config.shared)? global.config.shared.user.plan: [{id:'b2b',index:true},{id:'b2b-school',index:true}];
    this.cohorts = plans.filter(plan=>plan.index).map(plan=> plan.id);
    this.users = users.map(user => user.id||user).concat(this.cohorts,['anonymous']);


    this.orders=orders;
    this.products=products;

    //
    // map user plan with orders history;
    const planUids = users.filter(user => this.cohorts.some(cohort => cohort == (user.plan)))
    this.orders.forEach(order => {
      const user = planUids.find(user => user.id == order.customer.id)
      order.customer.plan = user && user.plan;
    })


    // INIT Matrix
    // Array(9).fill().map(()=>Array(9).fill())
    this.matrix = [];
    for(var i=0; i<this.users.length; i++) {
        // FIXME remove fill(0) and use sparce matrix for faster computation  !!
        this.matrix[i] = new Array(this.products.length);
    }
  }


  //
  // matrixCell('category','movie-name', 'user', 'score');
  // return matrix
  learn(user,product,qty, normalize){
    qty=qty||1;
    assert(product);
    assert(user);


    const uid=user;
    const pid=product.sku||product;    
    const row=this.users.findIndex(user => user==uid);
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
    //
    // for plan or anonymous averaging the orders count (total orders / total users)
    if(normalize) {
      this.matrix[row][col]= (this.matrix[row][col]+qty)/(normalize);
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
    // https://www.desmos.com/calculator/asm4ovwczk?lang=fr
    //let boost=1/(Math.pow(timeInMonth+1,4)*0.15)+0.01;
    const att = this.attenuation;
    const boost=1/(Math.pow(timeInMonth+att.fA,att.fB)) * att.fC +att.fD;
    return boost;
  }

  //
  // index products by UID
  // user can be a cohort name (school, anon, etc.) or an uid
  // in case of plan, uid is plan name and planUid is the uid that belongs to
  index(uid){
    uid = uid.id||uid;

    //
    // total orders for this user (or user plan)
    let orders=this.orders.filter(o=> (o.customer.plan||o.customer.id) == (uid)>-1);
    let rowuid=this.users.findIndex(user=>(user.id||user)==(uid));

    this.debug && console.log('---        index user',rowuid, uid, this.matrix[rowuid].length);
     
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
      // 1. donne du poids aux sku qui sont plus fréquents dans l'ensemble des commandes
      // orderFreq / ordersLen
      // nombre de commandes de l'utilisateur pour ce produit, atténué par le temps

      const ordersLen = orders.length+1;
      score = Math.log(prodFreq) * (( orderFreq / ordersLen));
      if(Number.isNaN(score)) {
        console.log('--- DBG error index score == NaN',sku,uid, prodFreq,orderFreq,ordersLen )
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
    // sort user
    this.ratings[uid]=this.ratings[uid].filter(rating=>rating).sort((a,b)=>{
      return b.score-a.score;
    });
    //console.log('---        DBG rating for ',uid, this.ratings[uid]);
  }


  train(){
    console.log('--- users score');
    this.users.forEach(this.index.bind(this));
    const cats = Object.keys(this.maxScore);

    this.categoriesWeight = cats.map(cat =>{
      return {
        name:cat,
        min:this.minScore[cat],
        avg:(this.maxScore[cat]-this.minScore[cat])/2, 
        max:this.maxScore[cat],
      }
    });
    console.log('--- categories score',this.categoriesWeight.length);
    const defaultPath = this.path||'./machine';
    return new MachineIndex({
      products:this.products,
      categoriesWeight:this.categoriesWeight,
      rating:this.ratings,
      model:this.model,
      domain:this.domain,
      cohorts:this.cohorts,
      timestamp: Date.now(),
      vectorsfile: defaultPath+ '/' + 'hnswlib-openai-index',
      path:defaultPath
    });
  }

}

