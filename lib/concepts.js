"use strict";
var moment = require('moment');
var Promise  = require('bluebird');
var _  = require('lodash');


class Concepts{

  constructor(options){
    this.options=options||{};

    this.Clarifai = require('clarifai');
    this.Promise  = require('bluebird');

    // output classification
    this.classification={graph:[]};
    this.graph={best:{},worth:{}};
    this.concepts={};
    this.products =[];
    this.today=new Date();
  }

  save(filename, elems){
    var fs = require('fs');
    var content = JSON.stringify(elems||this.products,0,2);
    fs.writeFile(filename, content, 'utf8', function (err) {
      if (err) {
          return console.log(err);
      }
    }); 
  }

  //
  // detect classification
  detection(products){
    // api key (scope=all)
    var today=Date.now();
    var key=this.options.key||'d45ec8c49d63443aa2375e5eb2a18a51';
    var app = new Clarifai.App({
      apiKey: key
    });

    // reset
    var results=this.products=[];
    //
    // 
    return Promise.mapSeries(products,function(product,i){
      return app.models.predict(Clarifai.FOOD_MODEL, 'https:'+product.photo.url,{language: 'en'}).then(function(res){
        return res.outputs[0].data.concepts;
      });
    }).then(function(predicts){
      predicts.forEach(function(concepts,i){
        var tags=concepts.filter(function(concept) {return (concept.value>0.95);}).map(function(e){return e.name});
        results.push({
          sku:products[i].sku,
          title:products[i].title,
          image:products[i].photo.url,
          categories:products[i].categories,
          tags:tags,
          updated:today
        });
      });
      return results;
    });
  }

  //
  //
  buildIndex(products){
    this.products=products||this.products;
    var prod_sz=this.products.length;

    //
    // already done
    if(typeof this.products[1].tags[0]==='string'){      
      //
      // compute tags freq
      this.products.forEach(prod =>{
        prod.tags.forEach(tag=>{
          if(!this.concepts[tag]){
            this.concepts[tag]=0;
          }
          this.concepts[tag]++;
        })
      })


      // https://fr.wikipedia.org/wiki/TF-IDF
      // IDF
      // fréquence inverse de produit log(P/{pi;tag€pi})
      // P = this.products.length
      // {pi;tag€pi} = nb de produit ou le tag apparaît
      Object.keys(this.concepts).map(tag=> {
        this.concepts[tag]=Math.log(prod_sz/this.concepts[tag]);
      });

      // TF
      // tag vs le nombre de tags dans un produit 1/N
      this.products.forEach(prod =>{
        //
        // sorting tag based on score
        prod.tags=prod.tags.map(tag=>{
          return {name:tag,score:this.concepts[tag]*1/prod.tags.length}
        }).sort((a,b)=>{
          return b.score-a.score;
        });
      });
    }
    //
    // build graph between products
    this.products.forEach(prod =>{
      //
      // graph best concetp with the product
      prod.tags.forEach(tag=>{
        if(tag.score<.7){
          return;
        }
        if(!this.graph.best[tag.name]){
          this.graph.best[tag.name]=[];
        }
        this.graph.best[tag.name].push({
          product:prod,
          score:tag.score
        }); 
  
      })
    });
        

    return this.products;
  }


  //
  // return connected products with this one
  similar(product){
    let linked=[];
    if(!product.tags.length)return linked;

    product.tags.forEach(tag=>{
      if(tag.score<.7){
        return;
      }
      linked=_.uniq(linked.concat(this.graph.best[tag.name]));
    });  
    return linked;
  }

  getGraph(){
    return this.graph;
  }

  //
  // return 

  //
  // 
  classification(){
    this.products.forEach(function(product) {
      if(!this.classification[product.categories]){
        this.classification[product.categories]={};
      }
      product.tags.forEach(function(tag){
        if(!this.classification[product.categories][tag.name]){
          //
          // TODO category should not be null
          if(!product.categories)
            return;
          this.classification.graph.push({node:product.categories, vertex:tag.name});
          this.classification[product.categories][tag.name]=0;
        }
        this.classification[product.categories][tag.name]++;
      });
    });


    Object.keys(this.classification).forEach(function(category){
      Object.keys(this.classification[category]).sort(function(a,b){
        return this.classification[category][b]-this.classification[category][a];
      })
    });

    return this.classification;
    
  }
}


module.exports=Concepts;

