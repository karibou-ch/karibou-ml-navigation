
// minimal format for testing purposes
import 'should';
require('dotenv').config();
const { readFileSync, writeFileSync } = require('fs');
const {
  memoryUsage,
  MachineIndex,
  MachineOpenAI,
  downloadProducts
} = require('../lib');

const QI = new MachineOpenAI({
  OPENAI_API_KEY:(process.env.OPENAI_API_KEY),
});

//
// load products
const axios = require('axios');
const tiny = true;
const server = 'karibou.evaletolab.ch';
const products = [
  1000016, // falafels 
  1001851, // petite pomme gala (7)
  1001884, // poire conférence
  1004380, // panier fruits bio
  1001957, // banane bio
  1001967, // tomate mélange d’été
  1001974, // tomate piccadilly
  1000675, // tomate farçie maison
  1001895, // avocat (10)
  1001859, // carotte
  1001858, // brocoli
  1001917, // echalote banane
  1002417, // maïs doux 
  1001862, // pomme de terre agria
  1001987, // courgette blanche
  1002007, // rave
  1002691, // noix sèche 
  1001867, // pomme de terre grenaille
  1002883, // beurre de fromagerie
  1002880, // lait entier genevois uht
  1001919, // oeuf frais
  1003892, // yogourt mocca
  1002412, // pain pur levain
  1003716, // côte de porc fermier
  1000010, // pâté maison
  1001266, // ste-pastule 33cl. bière blonde
  1000231, // véritable schüblig artisanale de st-gall
  1002590, // gruyère mi-salé aop
  1003933, // lardo iberico
  1003724, // entrecôte parisienne 
  1002178, // hamburger 100% boeuf
  1001522, // cuisse de pintade, label rouge
  1002152, // dinde panée label rouge
  1003747, // boulettes de volaille 
  1001734, // baguette du dimanche
  1002971, // domaine de la mermière gamay vieilles-vignes
  1002468, // bemontois 
  1002551, // crottin de chèvre bio au lait cru
  1002835, // ravioli 4 fromages
  1002805, // viande séchée cheval
  1001516, // manchon de poulet
  1002436, // burger de volaille
  1002593, // vacherin fribourgeois classic aop
  1004333, // kefta agneau menthe 
  1000003, // bavette
  1002969, // raclette suisse
  1004253, // domaine de la mermière chasselas
  1000012  // choucroute maison  
];

let vectors;
const embeddingfile = './data/embedding-mixed.json';

describe('testing best embedding strategy: mixed', function () {
  this.timeout(500000);
  let items:any[] = [];
  let machine;
  before(async () => {
    console.log('--- load products ...');
    items = await downloadProducts(products,{ axios, server, tiny });
    machine = new MachineIndex({
      products:items,
      timestamp: Date.now(),
      inmemory:true,
      vectorsfile:('./data/hnswlib-index-tarte_au_saumon.dat')
    });

    try{
      let data = readFileSync(embeddingfile, 'utf8');
      vectors = JSON.parse(data);
      return;  
    }catch(err){}
    vectors = {};
    for (let item of items) {
      try{
        let text =`Produit: ${item.title}\nCatégorie: ${item.context}\nDescription: ${item.description}`;
        if(item.tags) text+=`\nTags: ${item.tags}`
        console.log('---',text)
        const listOfVectors = await QI.openaiEmbedding(text);
        process.stdout.write('.');
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
  it('search fruits', async () => {

    console.log();
    memoryUsage('init');
    //
    // index
    machine.resetKnn();
    machine.indexKnn(vectors,{m:40,ef:300});
    memoryUsage('index');

    //
    // apply query fruits
    const query = await QI.openaiEmbedding('catégorie légumes')
    const skus = machine.searchKnn(query, 20);

    const elems = skus.map(elem =>  {
      return { ...elem, ...items.find(itm => itm.sku == elem.sku)}
    });//.sort(sortByTitle);
    for (let item of elems) {
      console.log('-',item.score, item.sku,item.title);
    }
  });

  xit('search légumes', async () => {
    //
    // apply query fruits
    const query = await QI.openaiEmbedding('légumes')
    const skus = machine.searchKnn(query, 20);

    const elems = skus.map(elem =>  {
      return { ...elem, ...items.find(itm => itm.sku == elem.sku)}
    });//.sort(sortByTitle);
    for (let item of elems) {
      console.log('-',item.score, item.sku,item.title);
    }


  });

  xit('search viande', async () => {
    //
    // apply query fruits
    const query = await QI.openaiEmbedding('viande')
    const skus = machine.searchKnn(query, 20);

    const elems = skus.map(elem =>  {
      return { ...elem, ...items.find(itm => itm.sku == elem.sku)}
    });//.sort(sortByTitle);
    for (let item of elems) {
      console.log('-',item.score, item.sku,item.title);
    }
  });

  it('get index info', async () => {
    const skus = machine.indexKnnGetSKUS();
    console.log('- list ',skus.length);
  });


});

