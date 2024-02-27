
// minimal format for testing purposes
require('should');
require('dotenv').config();
const { readFileSync, writeFileSync } = require('fs');

const {
  memoryUsage,
  MachineOpenAI,
  MachineIndex,
  downloadProducts
} = require('../dist');


const QI = new MachineOpenAI({
  OPENAI_API_KEY:(process.env.OPENAI_API_KEY),
});


//
// load products
const axios = require('axios');
const tiny = true;
const server = 'karibou.evaletolab.ch';
const products = [
  1000006,
  1000009,
  1000232,
  1001820,
  1002331,
  1002336,
  1002429,
  1002445,
  1002595,
  1002609,
  1002684,
  1002747,
  1002748,
  1002827,
  1002916,
  1002929,
  1003192,
  1003276,
  1003445,
  1003446,
  1003521,
  1003611,
  1003612,
  1003613,
  1003614,
  1003670,
  1003713,
  1003916,
  1003962,
  1003970,
  1004041,
  1004118,
  1004127,
  1004274,
  1004286,
  1004307,
  1004431,
  1004437,
  1004490,
  1004503,
];

let vectors;
const embeddingfile = './data/embedding-tarte_au_saumon.json';

describe('testing best embedding strategy: tarte_au_saumon', function () {
  this.timeout(500000);
  let items = [];
  let machine;
  let tarte_au_saumon_query;
  before(async () => {
    console.log('--- load products ...');
    items = await downloadProducts(products,{ axios, server, tiny });
    machine = new MachineIndex({
      products:items,
      timestamp: Date.now(),
      inmemory:true,
      vectorsfile:('./data/hnswlib-index-tarte_au_saumon')
    });
    
    try{
      tarte_au_saumon_query = await QI.openaiEmbedding("tarte au saumon");
      let data = readFileSync(embeddingfile, 'utf8');
      vectors = JSON.parse(data);
      return;  
    }catch(err){}
    vectors = {};
    for (let item of items) {
      try{
        let text =`Titre: ${item.title}\nDescription: ${item.description}\nCatégorie: ${item.context}\n`;
        // if(item.tags) text+=`\nTags: ${item.tags}`
        //process.stdout.write('.');
        console.log('---\n',text)
        const listOfVectors = await QI.openaiEmbedding(text);
        vectors[item.sku]= listOfVectors;  
      }catch(err){
        console.log(err);
      }  
    }
    writeFileSync(embeddingfile, JSON.stringify(vectors,null,2), 'utf8');


  });

  // Titre: title
  // Description: title
  // Context: title
  it('A strategie for embeding', async () => {
    console.log();
    memoryUsage('init');
    //
    // index
    machine.resetKnn();
    machine.indexKnn(vectors);
    memoryUsage('index');

    //
    // apply query tarte au saumon
    const skus = machine.searchKnn(tarte_au_saumon_query, 20);

    const elems = skus.map(elem =>  {
      return { ...elem, ...items.find(itm => itm.sku == elem.sku)}
    });//.sort(sortByTitle);
    for (let item of elems) {
      console.log('--- A',item.score, item.sku,item.title);
    }
  });

  // Titre: title
  // Context: title (MEDIUMLY BAD)
  xit('B strategie for embeding', async () => {
    const vectors = {};
    console.log('A ',items[0].embed);
    for (let item of items) {
      try{
        const listOfVectors = await QI.openaiEmbedding(item.embed);
        process.stdout.write('.');
        vectors[item.sku]= listOfVectors;  
      }catch(err){
        console.log(err);
      }  
    }
    console.log();
    memoryUsage('init');

    //
    // index
    machine.resetKnn();
    machine.indexKnn(vectors);
    memoryUsage('index');

    //
    // apply query tarte au saumon
    const skus = machine.searchKnn(tarte_au_saumon_query, 20);
    const elems = skus.map(elem =>  {
      return { ...elem, ...items.find(itm => itm.sku == elem.sku)}
    });//.sort(sortByTitle);
    for (let item of elems) {
      console.log('--- B',item.score, item.sku,item.title);
    }

  });

  // Titre: title (SUPER BAD)
  xit('C strategie for embeding', async () => {
    const vectors = {};
    console.log('C ',items[0].title);
    for (let item of items) {
      try{
        const listOfVectors = await QI.openaiEmbedding(item.title);
        process.stdout.write('.');
        vectors[item.sku]= listOfVectors;  
      }catch(err){
        console.log(err);
      }  
    }
    console.log();

    //
    // index
    machine.resetKnn();
    machine.indexKnn(vectors);
  
    //
    // apply query tarte au saumon
    const skus = machine.searchKnn(tarte_au_saumon_query, 20);
    const elems = skus.map(elem =>  {
      return { ...elem, ...items.find(itm => itm.sku == elem.sku)}
    });//.sort(sortByTitle);
    for (let item of elems) {
      console.log('--- C',item.score, item.sku,item.title);
    }

  });

});
