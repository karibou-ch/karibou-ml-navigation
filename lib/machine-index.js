"use strict";
var assert = require('assert');
var _      = require('lodash');
var fs     = require('fs');

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
    this.rating=options.rating||{};
    assert(this.domain);
    assert(this.model);
  }

  static load(path,domain){
    var content=fs.readFileSync(path+'/'+domain+"-model.json",{ encoding: 'utf8' });
    if(!content){
      throw new Error('Error reading file:'+path+'/'+domain+"-model.json");
    }

    content=JSON.parse(content);
    return new MachineIndex({
      model:Object.assign(new Model,content.model),
      rating:content.rating,
      domain:content.domain
    });
  }  

  neighbors(){
    return this.model.neighbors.apply(this.model, arguments);
  }

  recommendations(user,n){
    if(!user){
      let recommendations=model.recommendations(user,n);
    }
    return this.model.recommendations.apply(this.model, [user,n]);
  }

  ratings(user,n){
    return this.rating[user].splice(0,n||20);
  }

  save(path){
    var fs = require('fs');
    var content = {
      domain:this.domain,
      model:this.model,
      rating:this.rating
    };
    return new Promise((resolve,reject)=>{
      fs.writeFile(path+'/'+this.domain+this.file, JSON.stringify(content,0), 'utf8', function (err) {
        if (err) {
            return reject(err);
        }
        resolve(content.model);
      });   
    });
  }
}


module.exports=MachineIndex;

