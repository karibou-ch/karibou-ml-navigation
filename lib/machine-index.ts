"use strict";

import { productToLeanObject } from "./utils";
import { strict as assert } from 'assert';
import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { HierarchicalNSW } from 'hnswlib-node';


//
// with small size of content fuzzy is better than lucene
import fuzzysort from 'fuzzysort';
import natural from 'natural';

//
// vector, matrix and geometry library
export class MachineIndex{

  debug;
  domain;
  file;
  model;
  categoriesWeight;
  rating;
  cohorts; // anonymous, b2b, shcool, etc.
  products;
  vendors;
  categories;
  timestamp;
  path;

  //
  // lucene
  autocomplete;

  //
  // vectors
  space;  
  inmemory;
  vectorsfile;
  vectorsindex;
  vectorsdistance;
  _classified;



  constructor(options){
    assert(options.products);
    assert(options.vectorsfile);

    this.debug = options.debug;
    this.products=options.products.slice();

    //
    // products rating
    this.timestamp=options.timestamp|| Date.now();
    this.domain=options.domain||'karibou.ch';
    this.file=".model.json";
    this.model=options.model;
    this.categoriesWeight = options.categoriesWeight||[];
    this.rating=options.rating||{};
    //
    // remove excluded cohorts
    const plans = (global.config && global.config.shared)? global.config.shared.user.plan: ['b2b','b2b-school'];
    this.cohorts = plans.filter(plan => !plan.index).map(plan => plan.id);
    this.vendors;
    this.categories; 
    this.path=options.path;

    //
    // normalize cats
    this.products.forEach(product => {
      const extend = product.categories.split(/[:;]/);
      product.categories = extend.length? extend[0]: product.categories;
    })

    //
    // vector index
    // 
    this.inmemory = !!options.inmemory
    this.space=options.space||1536;
    this.vectorsdistance=options.vectorsdistance||'l2';
    this.vectorsfile=options.vectorsfile;    


    //
    // load index
    // https://github.com/nmslib/hnswlib
    // https://github.com/yoshoku/hnswlib-node
    this.vectorsfile = this.vectorsfile.replace('.dat','');

    if(existsSync(this.vectorsfile+'.dat')) {
      this.vectorsindex = new HierarchicalNSW(this.vectorsdistance, this.space);
      this.vectorsindex.readIndexSync(this.vectorsfile+'.dat');
    }else {
      console.log('--- INDEX NOT FOUND',this.vectorsfile+'.dat');
    }    

    //
    // lucene (like)
    // initial list creation
    this.categoriesList;
    this.vendorsList;
    this.classified;
    this.quickSearchInit();
    // console.log('--- categories',this.categoriesList);
    // console.log('--- vendors',this.vendorsList);

    console.log('--- DATE',this.timestamp);
    console.log('--- rating     size',this.humanSz(JSON.stringify(this.rating).length));
    console.log('--- product    size',this.humanSz(JSON.stringify(this.products).length),this.products.length);
    console.log('--- themes     size',this.humanSz(JSON.stringify(this.classified).length));
    console.log('--- completion size',this.humanSz(JSON.stringify(this.autocomplete).length));

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
    return this.categoriesWeight.sort((a,b)=> b.avg-(a.avg));
  }

  get classified() {
    if(this._classified) {
      const result = Object.assign({},this._classified);
      Object.defineProperty(result, "timestamp", { enumerable: false });
      return result;
    }
    // 
    // load cache if file exist and release memory as soon as possible;
    this._classified = null;
    try{
      let data = readFileSync(this.vectorsfile+'-classified.json', 'utf8');
      this._classified = data ?JSON.parse(data) : { timestamp:'1990'  };
      this._classified.timestamp = (this._classified.timestamp)? new Date(this._classified.timestamp):this.lastModified(this.vectorsfile+'-classified.json');
      Object.keys(this._classified).forEach(theme=>{
        if(theme == 'timestamp') return;
        const items = this._classified[theme].map(sku => sku+'');
        this._classified[theme] = [...(new Set(items))];
      });
    }catch(err) {
      this._classified = { timestamp:new Date('1990')  };
    }
    const result = Object.assign({},this._classified);
    result.timestamp = this._classified.timestamp;
    Object.defineProperty(result, "timestamp", { enumerable: false });
    return result;

  }

  set classified(value) {
    Object.assign(this._classified,value);

    //
    // free memory
    if(!value) {
      return;
    }
    this._classified.timestamp = Date.now();
    try{
      writeFileSync(this.vectorsfile+'-classified.json', JSON.stringify(this._classified,null,2), 'utf8');
    }catch(err) {}
  }

  classifiedDel(skus) {
    if(!this._classified) {
      return;
    }
    if(!Array.isArray(skus)) {
      throw new Error("SKUS should be an array");
    }

    Object.keys(this.classified).forEach(theme=>{
      skus.forEach(sku => {
        const idx = this._classified[theme].indexOf(sku+'');
        if(idx==-1)  { return }
        this._classified[theme].splice(idx,1);  
      })
    });

    this._classified.timestamp = Date.now();
    try{
      writeFileSync(this.vectorsfile+'-classified.json', JSON.stringify(this._classified,null,2), 'utf8');
    }catch(err) {}

  }

  classifiedGetSKUS(theme) {
    if(!this._classified) {
      return {skus:[]};
    }
    const key:any = Object.keys(this._classified).find(title => (natural.JaroWinklerDistance(theme,title,{ignoreCase:true})>.90))
    if(!key) {
      return {skus:[],key};
    }

    return {
      skus:this._classified[key].slice().filter(sku => +sku),
      key
    };
  }

  classifiedGetThemesFromSKUS(skus){
    if(!Array.isArray(skus)) {
      return [];
    }

    const themes = Object.keys(this._classified).map(theme => {
      (skus.some(sku => (this._classified[theme].indeOf(sku+'')>-1)))? theme:null;
    }).filter(theme => theme);

    return [...new Set(themes)];
  }
  
  //
  // when index was modified/created
  lastModified(file?) {
    try{
      file = file||(this.vectorsfile+'.dat');
      const stats = statSync(file);    
  
      // ✅ Get last modified date
      return new Date(stats.mtime);  
    }catch(err) {
      return new Date('1970');
    }
  }

  indexKnnGetSKUS() {
    if(!this.vectorsindex) {
      return [];
    }
    return this.vectorsindex.getIdsList();
  }

  indexKnnGetPoints(label) {
    if(!this.vectorsindex) {
      throw new Error("KNN service is not available");
    }
    return this.vectorsindex.getPoint(label);
  }


  //
  // create vector search indexer
  indexKnn(vectors, opts?) {
    opts = opts || { };
    const space = this.space; // the length of data point vector that will be indexed.
    const items = Object.keys(vectors);
    const maxElements = items.length; // the maximum number of data points.


    // declaring and intializing index.
    const index = this.vectorsindex = new HierarchicalNSW(this.vectorsdistance, space);
    console.log('init vectors index for ',maxElements,'entries');

    // https://github.com/nmslib/hnswlib/blob/master/ALGO_PARAMS.md
    // initIndex(maxElements, m?, efConstruction?, randomSeed?, allowReplaceDeleted?): void
    // (elem,16, 200,100)
    index.initIndex(maxElements+200, (opts.m||48), (opts.ef||400));

    for(let item of items){    
      if(item == 'timestamp') {continue}
      index.addPoint(vectors[item],+item );
    }

    if(this.inmemory) {
      return;
    }
    //
    // save KNN and the source
    index.writeIndexSync(this.vectorsfile+'.dat');
  }

  resetKnn() {
    this.vectorsindex = new HierarchicalNSW(this.vectorsdistance, this.space);
  }
  
  
  //
  // user vector KNN search
  // return {sku,score}
  searchKnn(vectors, neighbors) {
    neighbors = neighbors|| 40;

    if(!this.vectorsindex) {
      throw new Error("KNN service is not available");
    }

    const result = this.vectorsindex.searchKnn(vectors, neighbors);
    if(!result||!result.neighbors||!result.neighbors.length) {
      return [];
    }
    const skus = result.neighbors;
    const arrscore = result.distances.map(s => parseFloat((1-s).toFixed(2)));
    if(this.debug)console.log('---- DBG KNN search distance',arrscore);

    return skus.map((sku,idx)=> ({sku,score:(arrscore[idx])}));
  }

  quickSearchInit() {

    // filter out targets that you don't need to search! especially long ones!
    this.autocomplete = this.products.map(product => ({title:product.title,sku:product.sku}))

    
    // if your targets don't change often, provide prepared targets instead of raw strings!
    this.autocomplete.forEach(t => t.titlePrepared = fuzzysort.prepare(t.title))
    
    return this.autocomplete
  }


  quickSearch(text, opts?) {
    opts = opts ||{};
    const options = {
      key:'title',
      limit: (opts.limit||10), 
      threshold: -10000, // don't return bad results
    }

    const convertScore = (fuzzySortScore) => {
      // map score with the same pattern of KNN search
      const a = -1000, b = 0; // fuzzy score
      const c = 0.01, d = 1;  // knn score
      
      // convertion
      return c + (fuzzySortScore + 1000) * (d - c) / (b - a);
    }    
    // if(opts.highlight) {
    //   fuzzysort.highlight(bestResult[0]) // 'Google <b>Chr</b>ome'
    // }
    const results = fuzzysort.go(text, this.autocomplete, options) as Fuzzysort.KeyResults<any>;
    return results.map(result => ({sku:result.obj.sku,score:convertScore(result.score)}));
  }

  //
  // product created and not yet indexed
  addTempInMemory(product) {

    //
    // already in memory
    if(this.rating['anonymous'].some(sku => product.sku === sku)) {
      return;
    }

    this.products.push(product);
    this.quickSearchInit();

    //
    // get average score
    const categories = (product.categories.slug || product.categories);
    const catScore = this.categoriesScore.find(cat => cat.name == categories);
    if(!catScore) {
      return;
    }
    
    Object.keys(this.rating).forEach(user => {
      this.rating[user].push({
        item:product.sku, score:catScore.avg, sum: 1
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
      const content=readFileSync(path+'/'+domain+".model.json",{ encoding: 'utf8' });
      if(!content.length) {
        throw new Error('Error missing content for file:'+path+'/'+domain+".model.json")
      }

      const model=JSON.parse(content);

      return new MachineIndex({
        path:path,
        timestamp:new Date(model.timestamp),
        categoriesWeight:model.categoriesWeight,
        model:model.model,
        products:model.products,
        rating:model.rating,
        vectorsfile:model.vectorsfile,
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
        domain:domain,
        vectorsfile:path+ '/hnswlib-openai-index',
      });
    }
  }  

  reload(){
    const mi=MachineIndex.load(this.path,this.domain);
    if(mi.timestamp>this.timestamp){
      Object.assign(this,mi);
    }

    if(existsSync(this.vectorsfile+'.dat')) {
      this.vectorsindex = new HierarchicalNSW(this.vectorsdistance, this.space);
      this.vectorsindex.readIndexSync(this.vectorsfile+'.dat');
    }    

    this.quickSearchInit();
  }

  randomRatings(list,length,cohort?, filters?) {
    const randomness = this.ratings(cohort||'anonymous',length*10,(filters||{}))
                           .sort((a, b) => 0.5 - Math.random());

    return randomness.filter(elem => list.some(item => item.sku != elem.sku)).slice(0,length);
  }
  
  ratings(user,limit,params){
    //
    // default values
    limit = limit || 30;
    params = params || {};

    // default user is anon and customer is an alias of anon
    user=user || 'anonymous';
    //
    // we keep commmon rating only for shcool, b2b, ...
    params.cohort = params.cohort || 'anonymous';
    if(this.cohorts.some(cohort => cohort == params.cohort)) params.cohort = 'anonymous';
    if(params.cohort == 'customer' ) params.cohort = 'anonymous';

    //
    // define the common name for this group of users (school, b2b,...)
    const anonymous = params.cohort;
    //
    // initial values
    this.rating[user]=this.rating[user]||[];
    let result= this.rating[user].filter(rate=>rate);

    const subparams = {
      vendor:params.vendor,
      vendors:params.vendors,
      category:params.category
    };


    //
    // map ratings from input SKUS
    if(params.skus && params.skus.length) {
      let randomness = [];
      if(result.length < params.skus.length) {
        randomness = this.randomRatings(result,result.length/5,params.cohort,subparams);
      }
      const filtered = result.filter(rate =>  params.skus.some(sku => rate.item == sku));
      return filtered.concat(randomness).sort(this.sortByScore);
    }


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
      user !== anonymous
    ){
      const padN=(limit-result.length);
      //
      // merge anonymous data for missing score
      result=result.concat(this.ratings(anonymous,padN+1,subparams));
      //
      // unique items
      result=result.filter((elem: any,index, array: any[]) => array.findIndex(sub => sub.item == elem.item) === index);
    }

    //
    // if !pad, add 17% of randomness
    // this should be done by HNW (vector average)
    // this should not be applied on 
    if(!params.pad && user !== anonymous) {
      const randomness = this.randomRatings(result,limit/6,params.cohort,subparams);
      return result.concat(randomness).sort(this.sortByScore);
    }


    //
    // window of sorted results
    return result.sort(this.sortByScore).slice(0,limit);
  }

  sortByScore(a,b){
    return b.score-a.score;
  }

  save(path){
    this.vectorsfile = (path + '/' + 'hnswlib-openai-index');
    const content = {
      timestamp:this.timestamp,
      products:this.products,
      categoriesWeight:this.categoriesWeight,
      vectorsfile:this.vectorsfile,
      domain:this.domain,
      model:this.model,
      rating:this.rating
    };

    writeFileSync(path + '/' + this.domain + this.file, JSON.stringify(content, null, 0), 'utf8');
    return this;
  }

}


