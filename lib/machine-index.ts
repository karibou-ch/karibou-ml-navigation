"use strict";
const assert   = require('assert');
const _        = require('lodash');
const fs       = require('fs');

//
// vector, matrix and geometry library
// http://sylvester.jcoglan.com/
export class MachineIndex{

  domain;
  file;
  model;
  categoriesWeight;
  rating;
  products;
  vendors;
  categories;
  timestamp;
  path;

  constructor(options){


    // model
    this.timestamp=options.timestamp;
    this.domain=options.domain||'karibou.ch';
    this.file=".model.json";
    this.model=options.model;
    this.categoriesWeight = options.categoriesWeight||[];
    this.rating=options.rating||{};
    this.products=options.products||[];
    this.vendors;
    this.categories;    
    this.path=options.path;
    console.log('--- DATE',this.timestamp);
    console.log('--- rating     size',this.humanSz(JSON.stringify(this.rating).length));
    console.log('--- product    size',this.humanSz(JSON.stringify(this.products).length),this.products.length);
    assert(this.domain);
    assert(options.products);

    //
    // initial list creation
    this.categoriesList;
    this.vendorsList;
    // console.log('--- categories',this.categoriesList);
    // console.log('--- vendors',this.vendorsList);

  }

  get usersList() {
    return Object.keys(this.rating);
  }

  get vendorsList(){
    if(this.vendors){
      return Object.keys(this.vendors).sort();
    }
    this.vendors={};
    this.products.forEach(prod=>{
      this.vendors[prod.vendor]= this.vendors[prod.vendor] ||[];
      this.vendors[prod.vendor].push(prod.sku);
    });
    return Object.keys(this.vendors).sort();
  }



  get categoriesList(){
    if(this.categories){
      return Object.keys(this.categories).sort();
    }
    this.categories={};
    this.products.forEach(prod=>{
      this.categories[prod.categories] = this.categories[prod.categories] || [];
      this.categories[prod.categories].push(prod.sku);
    });
    return Object.keys(this.categories).sort();
  }

  get categoriesScore(){
    return this.categoriesWeight.sort((a,b)=> a.name.localeCompare(b.name));
  }

  //
  // product created and not yet indexed
  addTempInMemory(product) {
    //
    // already in memory
    if(this.rating['anonymous'].some(sku => product.sku === sku)) {
      return;
    }
    Object.keys(this.rating).forEach(user => {
      this.rating[user].push({
        item:product.sku, score:0.555, sum: 1
      });
    });

    //
    // save ??
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
    //
    // first time
    if(!this.categories[category]||!this.categories[category].length){
      this.categories[category]=this.products.filter(product=>product.categories==category).map(product=>product.sku);
    }
    return this.categories[category] ||[];
  }


  //
  // get list of SKU from one vendor or a list [v1,v2,v3]
  getVendorSku(vendor){
    if(Array.isArray(vendor)) {
      return vendor.reduce((skus, vendor) => (this.vendors[vendor]||[]).concat(skus),[]);
    }

    //
    // first time can not be an Array
    if(!this.vendors[vendor] || !this.vendors[vendor].length){
      this.vendors[vendor]=this.products.filter(product=>product.vendor==vendor).map(product=>product.sku);
    }
    return this.vendors[vendor]||[];
  }

  static load(path,domain){
    try{
      const content=fs.readFileSync(path+'/'+domain+".model.json",{ encoding: 'utf8' });
      if(!content.length) {
        throw new Error('Error missing content for file:'+path+'/'+domain+".model.json")
      }

      const model=JSON.parse(content);

      return new MachineIndex({
        path:path,
        timestamp:new Date(model.timestamp),
        likely:model.likely,
        model:model.model,
        products:model.products,
        rating:model.rating,
        domain:model.domain
      });      
    }catch(e){
      console.log('-- ','Error reading file:'+path+'/'+domain+".model.json")
      // throw new Error('Error reading file:'+path+'/'+domain+"-model.json");
      // Create an empty Index
      return new MachineIndex({
        model:{},
        products:[],
        rating:{},
        domain:domain
      });
    }
  }  

  reload(){
    let mi=MachineIndex.load(this.path,this.domain);
    if(mi.timestamp>this.timestamp){
      Object.assign(this,mi);
    }
  }

  
  ratings(user,limit,params){
    //
    // default values
    limit = limit || 20;
    user=user || 'anonymous';
    params = params || {};

    //
    // initial values
    this.rating[user]=this.rating[user]||[];
    let result= this.rating[user].filter(rate=>rate);

    //
    // popular by category
    if(params.category){
      const categorySku = this.getCategorySku(params.category);
      result=result.filter(rate=>categorySku.indexOf(rate.item)>-1);
    }

    //
    // popular by vendor
    if(params.vendor){
      const vendorSku = this.getVendorSku(params.vendor);
      result=result.filter(rate=>vendorSku.indexOf(rate.item)>-1);
    }

    //
    // constrains by HUBs of vendors
    if(params.vendors && params.vendors.length){      
      const vendorSku = this.getVendorSku(params.vendors);
      result=result.filter(rate=>vendorSku.indexOf(rate.item)>-1);
    }

    //
    // pad items with normalized ratings
    if(
      params.pad &&
      result.length < limit &&
      user !== 'anonymous'
    ){
      const padN=(limit-result.length);
      //
      // merge anonymous data for missing score
      result=result.concat(this.ratings('anonymous',padN+1,params));
      //
      // unique items
      result=result.filter((elem: any,index, array: any[]) => array.findIndex(sub => sub.item == elem.item) === index);
    }

    //
    // if !pad, add 20% of randomness
    if(!params.pad && user !== 'anonymous') {
      const padN = (Math.random()*result.length / 4)|0;
      const randomness = this.ratings('anonymous',padN,params);      
      for (const elem of randomness) {
        if(result.some(item => item.sku == elem.sku))  continue;
        result.push(elem);
      }
    }


    //
    // window of sorted results
    return result.sort(this.sortByScore).slice(0,limit);
  }

  sortByScore(a,b){
    return b.score-a.score;
  }

  save(path){
    var $this=this;
    var content = {
      timestamp:Date.now(),
      products:this.products,
      domain:this.domain,
      model:this.model,
      rating:this.rating
    };
    return new Promise((resolve,reject)=>{
      fs.writeFile(path+'/'+this.domain+this.file, JSON.stringify(content,null,0), 'utf8', function (err) {
        if (err) {
            return reject(err);
        }
        resolve($this);
      });   
    });
  }
}


