var should = require('should');
var products = require('./data/products');
var orders = require('./data/orders.json');

var Clarifai = require('clarifai');
var Promise  = require('bluebird');

describe('Clarifai API', function() {
  // api key (scope=all)
  var key='d45ec8c49d63443aa2375e5eb2a18a51';
  var app = new Clarifai.App({
    apiKey: key
  });
  it('predict product concepts from image ', function(done) {
    this.timeout(500000);
    products.should.be.an.Array();    
    var limit=2;
    var offset=(Math.random()*(products.length-limit))|0;
    //
    // 
    Promise.mapSeries(products,function(product,i){
      //
      // check for a sample
      if(i<offset||i>offset+limit){return []}
      
      //
      return app.models.predict(Clarifai.FOOD_MODEL, 'https:'+product.photo.url,{language: 'en'}).then(function(res){
        console.log('------------',JSON.stringify(res,0,1))
        return res.outputs[0].data.concepts;
      });
    }).then(function(predicts){
      predicts.forEach(function(concepts,i){
        if(!concepts.length)return;
        //console.log('node: ',products[i].title);
        console.log(products[i].title,':',concepts.filter(function(concept) {return (concept.value>0.95);}).map(function(e){return e.name}).join(','))
      })
      done();
    })
  });
  
  it('score on concepts, specific vs generic ', function(done) {
    var products = require('./data/products-clarifai.json');
    var Concepts = require('../lib/concepts')
    var concepts = new Concepts();
    
    //
    // 48 best products (last 4 month until 20.10.2017)
    var best_product=[1001064,1001201,1001122,1001046,1001072,1001110,1001161,1001037,1000626,1000625,1000652,1000030,1001038,1001172,1001092,1000018,1001199,1000704,1001075,1001109,1001167,1000054,1001048,1001107,1001143,1001040,1001097,1000090,1000029,1001198,1001133,1001114,1000653,1000008,1001301,1001302,1001055,1000025,1000056,1001217,1000013,1001160,1000020,1000226,1000717,1001243,1001049,1001095];
    concepts.buildIndex(products).forEach(p=>{
      if(best_product.indexOf(p.sku)===-1)return ;
      console.log('\n-- ',p.title)
      p.tags.forEach(tag=> {
        console.log('  #',tag.name,tag.score.toFixed(2));

      })
    });

    done();
  });

  it('get similar products based on concepts ', function(done) {
    var products = require('./data/products-clarifai.json');
    var Concepts = require('../lib/concepts');
    var concepts = new Concepts();
  
    //
    // 48 best products (last 4 month until 20.10.2017)
    var best_product=[1001064,1001201,1001122,1001046,1001072,1001110,1001161,1001037,1000626,1000625,1000652,1000030,1001038,1001172,1001092,1000018,1001199,1000704,1001075,1001109,1001167,1000054,1001048,1001107,1001143,1001040,1001097,1000090,1000029,1001198,1001133,1001114,1000653,1000008,1001301,1001302,1001055,1000025,1000056,1001217,1000013,1001160,1000020,1000226,1000717,1001243,1001049,1001095];
    concepts.buildIndex(products).forEach(p=>{
      if(best_product.indexOf(p.sku)===-1)return ;
      console.log('\n-- ',p.title)
      concepts.similar(p).forEach(link=> {
        console.log('  #',link.product.title,link.score.toFixed(2));
      })
    });

    done();

  });


});