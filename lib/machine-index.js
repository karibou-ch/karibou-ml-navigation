"use strict";
var assert   = require('assert');
var _        = require('lodash');
var fs       = require('fs');
var sylvester= require('sylvester');

//
// vector, matrix and geometry library
// http://sylvester.jcoglan.com/

//
// machine learning
var jonfon = require('jonfon');
var Model = jonfon.Model;


class MachineIndex{

  constructor(options){

    this.Promise  = require('bluebird');

    // model
    this.domain=options.domain||'karibou.ch';
    this.file="-model.json";
    this.model=options.model;
    this.likely=options.likely;
    this.rating=options.rating||{};
    this.products=options.products||[];
    this.vendors={};
    this.categories={};
    if(this.likely){
      this.model=new this.likely.Model(sylvester.Matrix.create(options.model.input),options.model.rowLabels,options.model.colLabels);
			this.model.input = sylvester.Matrix.create(options.model.input);	
      this.model.estimated=sylvester.Matrix.create(options.model.estimated);
    }
    console.log('--- CF likely',(!!this.likely));
    console.log('--- CF jonfon',(!!this.model));
    console.log('--- model      size',this.humanSz(JSON.stringify(this.model||'').length));
    console.log('--- rating     size',this.humanSz(JSON.stringify(this.rating).length));
    console.log('--- product    size',this.humanSz(JSON.stringify(this.products).length),this.products.length);
    assert(this.domain);
    assert(options.products);

  }

  humanSz(bytes) {
    var thresh = 1024;
    if(Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    var units = ['kb','Mb','Gb','Tb','Pb','Eb','Zb','Yb'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1)+' '+units[u];
  }

  getCategorySku(category){
    if(!this.categories[category]){
      this.categories[category]=this.products.filter(product=>product.categories==category).map(product=>product.sku);
    }
    return this.categories[category];
  }

  getVendorSku(vendor){

    if(!this.vendors[vendor]){
      this.vendors[vendor]=this.products.filter(product=>product.vendor==vendor).map(product=>product.sku);
    }
    return this.vendors[vendor];
  }

  static load(path,domain){
    var content=fs.readFileSync(path+'/'+domain+"-model.json",{ encoding: 'utf8' });
    if(!content){
      throw new Error('Error reading file:'+path+'/'+domain+"-model.json");
    }

    content=JSON.parse(content);
    if(content.likely){
      content.likely = require('likely');
    }else{
      content.model=Object.assign(new Model,content.model);
    }



    return new MachineIndex({
      likely:content.likely,
      model:content.model,
      products:content.products,
      rating:content.rating,
      domain:content.domain
    });
  }  

  mapLikely(reco){
    return reco;
    //return {item:reco[0],score:reco[1]};
  }

  neighbors(){
    if(!this.model.neighbors){
      return [];
    }
    return this.model.neighbors.apply(this.model, arguments);
  }

  recommendations(user,n,params){
    if(params.category){
      this.getCategorySku(params.category);
      return this.model.recommendations(user,1000).map(this.mapLikely).filter(reco=>this.categories[params.category].indexOf(reco.item)>-1).slice(0,n||20);
      // return this.model.recommendations(user,1000).filter(reco=>this.categories[category].indexOf(reco.item)>-1).slice(0,n||20);
    }
    if(params.vendor){
      this.getVendorSku(params.vendor);
      return this.model.recommendations(user,1000).map(this.mapLikely).filter(reco=>this.vendors[params.vendor].indexOf(reco.item)>-1).slice(0,n||20);
      // return this.model.recommendations(user,1000).filter(reco=>this.vendors[vendor].indexOf(reco.item)>-1).slice(0,n||20);
    }
    return this.model.recommendations(user,n).map(this.mapLikely).slice(0,n||20);
  }

  ratings(user,n,params){
    user=user||'anonymous';
    params=params||{};
    this.rating[user]=this.rating[user]||[];
    if(params.category){
      this.getCategorySku(params.category);
      return this.rating[user].filter(reco=>this.categories[params.category].indexOf(reco.item)>-1).sort(this.sortByScore).slice(0,n||20);
    }
    if(params.vendor){
      this.getVendorSku(params.vendor);
      return this.rating[user].filter(reco=>this.vendors[params.vendor].indexOf(reco.item)>-1).sort(this.sortByScore).slice(0,n||20);
    }
    return this.rating[user].slice(0,n||20);
  }

  sortByScore(a,b){
    return b.score-a.score;
  }

  save(path){
    var $this=this;
    var fs = require('fs');
    var content = {
      likely:this.likely,
      products:this.products,
      domain:this.domain,
      model:this.model,
      rating:this.rating
    };
    return new Promise((resolve,reject)=>{
      fs.writeFile(path+'/'+this.domain+this.file, JSON.stringify(content,0,2), 'utf8', function (err) {
        if (err) {
            return reject(err);
        }
        resolve($this);
      });   
    });
  }
}


module.exports=MachineIndex;

