// export NODE_OPTIONS='--experimental-fetch'
// npx tsx -r dotenv/config scripts/query-test1.ts

require('dotenv').config();
const { OpenAI } = require("openai");
const { writeFileSync, readFileSync } = require('fs');
const natural = require('natural');


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

//
// load products
const axios = require('axios');
const cleanTags = (text) => {
  return text.replace(/<br>(?=(?:\s*<[^>]*>)*$)|(<br>)|<[^>]*>/gi, (x,y) => y ? ' & ' : '').slice(0, text.indexOf('.')).replace(/(\r\n|\n|\r)/gm, "")
}

const categories = [
  "fromages-produits-frais",
  "traiteur-maison",
  "fruits-legumes",
  "boulangerie-artisanale",
  "boucherie-artisanale",
  "poissonnerie",
  "charcuterie-pates",
  "pates-sauces",
  "antipasti-conserves",
  "cereales-legumineuses-graines",
  "miels-confitures-et-plus",
  "douceurs-chocolats",
  "boissons",
  "bieres-artisanales",
  "vins-rouges",
  "vins-blancs-roses",
  "fleurs"
];

const main = async (category)=>{
  const filename = "./data/products-vectors.json";  
  const timestamp = Date.now(); 

  // 
  // load cache if file exist
  let vectors = {};
  try{
    let data = readFileSync(filename, 'utf8');
    vectors = JSON.parse(data);
  }catch(err) {}
  
  //
  // update timestamp
  vectors['timestamp'] = timestamp;


  let items=[];  

  console.log('--- DBG 1. download items for : ',category);
  const response = await axios.get("https://karibou.ch/api/v1/products/category/"+category);
  const products = response.data;
  items = products.filter(product => (product.belong && product.categories && product.photo)).map(product => {
    return {
      sku:product.sku,
      title: (product.title),
      description: cleanTags(product.details.description).substr(0, 80),
    }
  }).sort((a,b)=>{
    return a.title.localeCompare(b.title);
  });
  
  

    
  //
  // keep only new SKU
  items = items.filter(item => {
    return !vectors[item.sku];
  });

  for (let item of items) {
    try{

      //
      // gpt-embdding
      const embedding = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: (item.title+' (description):'+item.description+')'),
        encoding_format: "float",
      });

      const listOfVectors = embedding.data[0].embedding;
      vectors[item.sku]= listOfVectors;  
      console.log('-- vectors',item.title,'[',listOfVectors[0],',...]')
    }catch(err){
      console.log(err);
      console.log(res);

    }  
  }

  try{
    
    writeFileSync(filename, JSON.stringify(vectors,null,2), 'utf8');

  }catch(err) {
    console.log('---DBG error',err.response||err);
  }
}

(async () => {
for (const category of categories) {
  await main(category)
}
})();