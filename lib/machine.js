"use strict";
var moment       = require('moment');
var assert       = require('assert');
var MachineIndex = require('./machine-index');

//
// vector, matrix and geometry library
// http://sylvester.jcoglan.com/

//
// machine learning
var jonfon = require('jonfon');
var Engine = jonfon.Engine;
var Strategy = jonfon.Strategy;


class Machine{

  constructor(options){
    this.options=options||{};
    if(options.likely){
      // TODO use a common interface for native implementation
      this.likely = require('likely');
    }

    this.Promise  = require('bluebird');

    // output classification
    this.today=new Date();


    // model
    this.domain=this.options.domain||'karibou.ch';
    this.file="-model.json";
    this.approach='UserKNN_Jaccard';
    this.users=[];
    this.orders=[];
    this.products=[];
    this.matrix=[];
    this.model;
    this.ratings={};
    this.ratings['anonymous']=[];
    this.engine = new Engine();


    this.engine.addStrategy(this.approach, new Strategy(this.approach));
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
  // matrixCell('category','movie-name', 'user', 'score');
  // return matrix
  learn(user,product,score){
    score=score||1;
    // https://github.com/raghavgujjar/matrix#readme
    assert(product);
    assert(user);
    let uid=user.id||user;
    let pid=product.sku||product;    
    let row=this.users.findIndex(id=>id==uid);
    let col=this.products.findIndex(product=>product.sku==pid);
    if(row<0||col<0){
      return console.log('-- ERROR',uid,pid)
    }

    if(!this.matrix[row][col]){
      this.matrix[row][col]=0;
    }
    this.matrix[row][col]+=score;
    // let val=this.matrix(row,col);
    // this.matrix.set(row,col).to(val+score);    
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
        // FIXME remove fill(0) when using jonfon !!
        this.matrix[i] = new Array(this.products.length);//.fill(0);
    }

    // make a Matrix Object
    //this.matrix=matrix(matrix);
  }

  //
  // index products by 
  // log(Fp)*|p€O|/|O|
  // dimming is made when calling learn(...)
  index(uid){
    // total orders for this user
    let oidx=this.users.findIndex(u=>u==uid);
    if(oidx>=this.orders.length){
      return;
    }
    //
    // one month => 24h * 30
    let onemonth=86400000*30;
    let today=Date.now();
    let orders=this.orders[oidx]||[];
    let row=this.users.findIndex(id=>id==uid);


    // console.log('-- train',this.matrix[row].length,this.matrix[row].filter(o=>o).length)
    // total order by products
    this.ratings[uid]=this.matrix[row].filter(elem=>elem).map((count,i)=>{
      count=count||0;
      //
      // get product SKU
      let sku=this.products[i].sku;
      let boost_discount=(this.products[i].discount)?50:1;
//      let boost_discount=(this.products.find(p=>p.sku==sku).discount)?50:1;

      //
      // get the count of orders that contains the product
      // the sum of the orders is attenuated/boosted by the time (in month)
      // 1/[(x+2)⁰⁷*0.06]-1
      let sum=orders.reduce((sum,order)=>{
        let buy=order.items.filter(item=>item.sku==sku).length+1;
        let deltaMonth=Math.round((today-(new Date(order.shipping.when.$date).getTime()))/onemonth);
        let dimmer=1/(Math.pow(deltaMonth+2,0.7)*0.06)-1;
        // console.log('- dimmer',buy,dimmer,buy*dimmer+sum)
        return buy*dimmer+sum;
      },0);

      //
      // compute the score
      let score=0;
      if(count&&orders.length){
        score=(sum*boost_discount/(orders.length)*Math.log(count));  
      }

      return {
        item:sku,
        score:score,
        sum:count||0
      }
    });

    //
    // anonymous rating is the sum(score) of all users
    if(!this.ratings['anonymous'].length){
      this.ratings['anonymous']=this.products.map(product=>{
        return {
          item:product.sku,
          score:0,
          sum:0
        };
      });
    }
    
    this.ratings[uid].forEach((elem,i)=>{
      let rowx=this.ratings['anonymous'].findIndex($elem=>$elem.item==elem.item);
      this.ratings['anonymous'][row].score+=elem.score;
      this.ratings['anonymous'][row].sum+=elem.sum;
    });

    //
    // padding and sort user
    this.ratings[uid]=this.ratings[uid].sort((a,b)=>{
      return b.score-a.score;
    });

    // this.ratings['anonymous']
    // this.ratings['anonymous']=this.ratings['anonymous']
    //   .concat(this.ratings[uid])
    //   .filter((rating, pos, arr) => {
    //     return arr.findIndex(elem=>elem.item==rating.item) == pos;
    //   })
    //   .sort((a,b)=>{
    //     return b.score-a.score;
    //   });
  }


  indexAnonymous(){
    this.ratings['anonymous']=this.ratings['anonymous'].map(elem=>{
      elem.score=elem.score/this.users.length;
      return elem;
    }).sort((a,b)=>{
      return b.score-a.score;
    });

    // [0,1,2,3,4,5,6].forEach(i=>{
    //   console.log('----- anonyous',this.ratings['anonymous'][i].score,this.ratings['anonymous'][i].item)
    // });
  }

  train(){
    if(this.likely){
      console.log('--- build likely')
      this.model=this.likely.buildModel(this.matrix, this.users, this.products.map(product=>product.sku));
    }else{
      console.log('--- build jonfon')
      // this.engine.addModel(this.domain, this.matrix, this.users, this.products.map(product=>product.sku));
      // this.engine.process(this.approach, this.domain,{similarity: 'pearson',threshold:.1});
      // this.model=this.engine.getModel(this.domain);  
    }

    this.users.forEach(this.index.bind(this));
    this.indexAnonymous();

    return new MachineIndex({
      products:this.products,
      rating:this.ratings,
      model:this.model,
      domain:this.domain,
      likely:this.likely
    });
  }

}


module.exports=Machine;

