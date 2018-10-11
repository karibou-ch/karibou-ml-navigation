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

    this.Promise  = require('bluebird');

    // output classification
    this.products =[];;
    this.bests={};
    this.bestId=options.testid;
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
    this.engine = new Engine();

    this.engine.addStrategy(this.approach, new Strategy(this.approach),{similarity: 'cosine'});


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
    let col=this.products.findIndex(sku=>sku==pid);

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
    let orders=this.orders[oidx]||[];


    // total order by products
    this.ratings[uid]=this.model.ratings(uid).map((buys,i)=>{
      //
      // get product SKU
      let sku=this.model.colLabels[i];
      //
      // get the count of orders that contains the product
      let sum=orders.filter(order=>order.items.find(item=>{
        return item.sku==sku;
      })).length; 

      //
      // compute the score
      let score=(buys&&orders.length)&&(sum/(orders.length)*Math.log(buys))||undefined;
      // buys&&console.log('---',sku,buys,sum,orders.length,((sum+1)/orders.length),score) 
      return {
        item:sku,
        score:score,
        sum:buys
      }
    })
    .filter(elem=>elem.score).sort((a,b)=>{
      return b.score-a.score;
    });
  }


  train(){
    this.engine.addModel(this.domain, this.matrix, this.users, this.products);
    this.engine.process(this.approach, this.domain);
    this.model=this.engine.getModel(this.domain);
    // this.index(this.users[10]);//roman
    this.users.forEach(this.index.bind(this));
    return new MachineIndex({
      rating:this.ratings,
      model:this.model,
      domain:this.domain
    });
  }

}


module.exports=Machine;

