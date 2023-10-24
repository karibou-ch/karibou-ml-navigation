// export NODE_OPTIONS='--experimental-fetch'
// npx tsx -r dotenv/config scripts/query-test1.ts

require('dotenv').config();
const { OpenAI } = require("langchain/llms/openai");
const { writeFileSync, readFileSync } = require('fs');
const natural = require('natural');


//Je souhaite 4 repas pour la semaine avec la commande de produits qui suit.

const message = `
Tu agis comme un diététicien avec de nombreuses années d'expérience en cuisine qui travaille dans la ville de Genève. 
J'aimerais que tu classes les aliments fournis dans les différentes classifications suivantes.

Instructions pour les données d'entrée :

A. Les aliments sont décrits par leur nom et une description, séparés par le caractère ":".
B. Utilise uniquement le nom pour la classification. La description sert uniquement à fournir le contexte.
C. Ne crée pas de nouveaux aliments ou n'extrais pas des aliments de la description.

Instructions pour le traitement :

D. Attribue les aliments uniquement s'ils correspondent à plus de 90% aux thématiques mentionnées ci-dessous. Si un aliment est classé dans une thématique, il ne doit pas apparaître dans une autre.
E. Le résultat doit être produit au format JSON strict qui contient une liste des aliments pour chaque classe

Classification :

* Raclette
* Fondue
* Fromages à pâtes dures 
* Fromages à pâtes molle
* Fromages Bleus
* Fromages râpés
* Mozzarella & fromages frais
* Fromages italiens
* Fromage de brebis, de chèvre & de buffle
* Produits laitiers et Oeufs

Voici la liste des aliments à classer :


`;

//
// load products
const axios = require('axios');
const cleanTags = (text) => {
  return text.replace(/<br>(?=(?:\s*<[^>]*>)*$)|(<br>)|<[^>]*>/gi, (x,y) => y ? ' & ' : '').slice(0, text.indexOf('.')).replace(/(\r\n|\n|\r)/gm, "")
}

const categories = [
  "fromages-produits-frais",
  // "traiteur-maison",
  // "fruits-legumes",
  // "boulangerie-artisanale",
  // "boucherie-artisanale",
  // "poissonnerie",
  // "charcuterie-pates",
  // "pates-sauces",
  // "antipasti-conserves",
  // "cereales-legumineuses-graines",
  // "miels-confitures-et-plus",
  // "douceurs-chocolats",
  // "boissons",
  // "bieres-artisanales",
  // "vins-rouges",
  // "vins-blancs-roses",
  // "fleurs"
];

const main = async (category)=>{
  const filename = "./data/classification-"+category+".json";  
  let items=[];  

  console.log('--- DBG 1. download items for : ',category);
  const response = await axios.get("https://karibou.ch/api/v1/products/category/"+category);
  const products = response.data;
    items = products.filter(product => (product.belong && product.categories && product.photo)).map(product => {
    return {
      sku:product.sku,
      title: (product.title),
      description: cleanTags(product.details.description).substr(0, 60)+"...",
    }
  }).sort((a,b)=>{
    return a.title.localeCompare(b.title);
  });

  // const classifications = products.map(product => product.categories.slug);
  
  // console.log('---', classifications);
  // process.exit();
  
  //
  // models: gpt-3.5-turbo, gpt-4
  const model = new OpenAI({
    temperature: 0.2,
    maxTokens:-1,
    modelName:"gpt-4",  
    openAIApiKey: process.env.OPENAI_API_KEY
  });
  try{
    const chunkSize = 20;
    let classifier = {};
    let filterItems = [];

    // 
    // load cache
    try{
      let data = readFileSync(filename, 'utf8');
      classifier = JSON.parse(data);
      filterItems = Object.keys(classifier).reduce((sum, elem)=>{
        return sum.concat(classifier[elem]);
      },[])
    }catch(err) {}
    
    
    //
    // use only new SKU
    items = items.filter(item => {
      return !filterItems.some(_i => _i.indexOf(item.sku+'')==-1)
    });



    for (let i = 0; i < items.length; i += chunkSize) {

      const context = "\n* "+ items.slice(i, i + chunkSize).map(item => item.title+' : '+item.description).join('\n* ');    
      //const numTokens = await model.getNumTokens(message+context);
      console.log(' --- DBG products context\n\n',context);
      console.log('\n\n --- DBG chunk position',i,' of ',items.length);
      const res = await model.call(message+context);
      try{
        const json = /[^{]*(.*?)\}/gi.exec(res);
        console.log(res)
        const content = JSON.parse(`{${json[0]}`);
        Object.keys(content).forEach(key=>{
          classifier[key] = classifier[key] || [];
          classifier[key] = classifier[key].concat(content[key])          
        })
  
      }catch(err){
        console.log(err);
        console.log(res);

      }  
    }

    //
    // getting SKU
    Object.keys(classifier).forEach(theme => {
      classifier[theme].forEach((title,idx)=> {
        const product = products.find(prod =>  (natural.JaroWinklerDistance(prod.title,title,{ignoreCase:true})>.90));
        classifier[theme][idx] = title+':'+(product?product.sku:'-')
      })
    })
    
    writeFileSync(filename, JSON.stringify(classifier,null,2), 'utf8');

  }catch(err) {
    const stack = (err.response||err);
    console.log('---DBG error',stack.data||stack);
  }
}

(async () => {
for (const category of categories) {
  await main(category)
}
})();