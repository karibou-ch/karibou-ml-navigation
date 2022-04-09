"use strict";
const moment = require('moment');
const Clarifai = require('clarifai');

const { removeStopwords, fra } = require('stopword')

const uniq = (v, i, a) => a.indexOf(v) === i;

const mapSaves = async (iterable, action) => {
  let i=0;
  let results:any = [];
  for (const x of iterable) {
    const iter = (await action(x,i++));
    results.push(iter);
  }
  return results;
}

export class Concepts{
  options:any;
  classifications:any;
  graph:any;
  concepts:any;
  products:any;
  predicts:any;
  today:any;

  constructor(options){
    this.options=options||{};

    
    // output classifications
    this.classifications={graph:[]};
    this.graph={best:{},worth:{}};
    this.concepts={};
    this.products =[];
    this.predicts =[];
    this.today=new Date();
  }

  save(filename, elems){
    const fs = require('fs');
    const content = JSON.stringify(elems||this.products,null,2);
    fs.writeFile(filename, content, 'utf8', function (err) {
      if (err) {
          return console.log("--DBG",err);
      }
    }); 
  }

  buildLexico(products){
    let tags={};
    products.forEach(product=>{
      product.tags.forEach(tag=>{
        if(!tags[tag]){
          tags[tag]=0;
        }
        tags[tag]++;
      })
    });
    return tags;
  }


  lexical(products){
    let tags=[];
    products.forEach(product=>{
      let words=this.stringToWorlds(product.title || product.categories)
      tags=tags.concat(removeStopwords(words,fra)).filter(uniq).sort();
    });

    return tags;
  }


  stringToWorlds(text){
    return text
      .toLowerCase()
      .replace(/[/|&;$%@"'!<>()+-.–│,“«»  ]/g, " ")
      .replace(/(l'|d'|l’|d’)/g, "")
      .split(' ').filter(word=>word.length>2);
  }

  async logmealDetection(img) {
    const axios = require('axios');
    // Single/Several Dishes Detection
    const url = 'https://api.logmeal.es/v2/recognition/complete';

    // Headers
    const headers = {
      'Authorization': 'Bearer ' + 'api_user_token'
    };


    //
    // image data
    headers['Content-Type'] = 'multipart/form-data';
    const buffer = new ArrayBuffer(8);
    const data = new FormData();
    const blob = new Blob([buffer],{type : headers['Content-Type']});
    data.append('image', blob);    

    // Parameters
    const options = {
      url: url,
      method: 'POST',
      headers: headers,
      data
    };    
    
    //
    // image detection
    const detection = await axios.post(options);
    const imageId = detection.imageId;
    
    // Ingredients information
    const api = 'https://api.logmeal.es/v2/recipe/ingredients';
    headers['Content-Type'] = 'application/json';
    const content = await axios.post(url,{imageId},headers);
    
    console.log('--- DBG',content);
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
    this.predicts=this.products=[];
    var $this=this;
    //
    // 
    return mapSaves(products,(product,i) => {
      const model = Clarifai.FOOD_MODEL;
      const photo = (product.photo[product.photo.length-1]==='/') ? (product.photo+'-/resize/600x/'):product.photo;
      //console.log('----model',model,'photo',photo);
      return app.models.predict(model, 'https:'+photo,{language: 'en'}).then((res) => {
        const concepts = res.outputs[0].data.concepts || []; 
        console.log('-- detect',i,product.sku,product.title,concepts.map(c=>c.name).join(','))
        return concepts;
      }).catch((err) => {
        console.log('-- ERR',err.message||err);
        return [];
      });
    }).then((predicts:any)=>{
      predicts.forEach(function(concepts,i){
        var tags=concepts.filter((concept) => (concept.value>0.92)).map((e) => e.name);
        $this.predicts.push({
          sku:products[i].sku,
          title:products[i].title,
          image:products[i].photo,
          categories:products[i].categories,
          tags:tags,
          updated:today
        });
      });
      return $this.predicts;
    });
  }

  // extractTags() {
  //   const model ="9504135848be0dd2c39bdab0002f78e9";
  //   app.models.predict(model, "This is a text string").then(
  //     function(response) {
  //       // do something with response
  //     },
  //     function(err) {
  //       // there was an error
  //     }
  //   );
   
  // }

  //
  //
  buildIndex(products,score){
    score=score||.8;
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
    // this.products.forEach(prod =>{
    //   //
    //   // graph best concetp with the product
    //   prod.tags=prod.tags.filter(tag=>tag.score>score);
    //   prod.tags.forEach(tag=>{
    //     if(!this.graph.best[tag.name]){
    //       this.graph.best[tag.name]=[];
    //     }
    //     this.graph.best[tag.name].push({
    //       product:prod,
    //       score:tag.score
    //     }); 
  
    //   })
    // });
        

    return this.products;
  }


  //
  // return connected products with this one
  similar(product,score){
    score=score||0.8;
    let linked=[];
    if(!product.tags.length)return linked;

    product.tags.forEach(tag=>{
      if(tag.score<score){
        return;
      }
      linked=linked.concat(this.graph.best[tag.name]).filter(uniq);
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
    this.products.forEach((product)=>{
      if(!this.classifications[product.categories]){
        this.classifications[product.categories]={};
      }
      product.tags.forEach((tag)=>{
        if(!this.classifications[product.categories][tag.name]){
          //
          // TODO category should not be null
          if(!product.categories)
            return;
          this.classifications.graph.push({node:product.categories, vertex:tag.name});
          this.classifications[product.categories][tag.name]=0;
        }
        this.classifications[product.categories][tag.name]++;
      });
    });


    Object.keys(this.classifications).forEach((category)=>{
      Object.keys(this.classifications[category]).sort((a,b)=>{
        return this.classifications[category][b]-this.classifications[category][a];
      })
    });

    return this.classifications;
    
  }
}


module.exports=Concepts;

