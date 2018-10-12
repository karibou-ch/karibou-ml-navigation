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
    this.categories={};
    if(this.likely){
      this.model=new this.likely.Model(sylvester.Matrix.create(options.model.input),options.model.rowLabels,options.model.colLabels);
			this.model.input = sylvester.Matrix.create(options.model.input);	
      this.model.estimated=sylvester.Matrix.create(options.model.estimated);
    }
    console.log('--- CF likely',(!!this.likely));
    console.log('--- model      size',this.humanSz(JSON.stringify(this.model).length));
    console.log('--- rating     size',this.humanSz(JSON.stringify(this.rating).length));
    console.log('--- estimated  size',this.humanSz(JSON.stringify(this.model.estimated||[]).length));
    console.log('--- product    size',this.humanSz(JSON.stringify(this.products).length));
    assert(this.domain);
    assert(this.model);
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

  static load(path,domain){
    var content=fs.readFileSync(path+'/'+domain+"-model.json",{ encoding: 'utf8' });
    if(!content){
      throw new Error('Error reading file:'+path+'/'+domain+"-model.json");
    }

    content=JSON.parse(content);
    if(content.likely){
      content.likely = require('likely');
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
    return {item:reco[0],score:reco[1]};
  }

  neighbors(){
    if(!this.model.neighbors){
      return [];
    }
    return this.model.neighbors.apply(this.model, arguments);
  }

  recommendations(user,n,category){
    if(category){
      this.getCategorySku(category);
      return this.model.recommendations(user,1000).map(this.mapLikely).filter(reco=>this.categories[category].indexOf(reco.item)>-1).splice(0,n||20);
      //return this.model.recommendations(user,1000).filter(reco=>this.categories[category].indexOf(reco.item)>-1).splice(0,n||20);
    }
    return this.model.recommendations(user,n).map(this.mapLikely).splice(0,n||20);
  }

  ratings(user,n,category){
    user=user||'anonymous';
    if(category){
      this.getCategorySku(category);
      return this.rating[user].filter(reco=>this.categories[category].indexOf(reco.item)>-1).splice(0,n||20);
    }

    return this.rating[user].splice(0,n||20);
  }

  save(path){
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
        resolve(content.model);
      });   
    });
  }
}


module.exports=MachineIndex;

