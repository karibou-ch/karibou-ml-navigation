const { removeStopwords, fra } = require('stopword');
const customStopwords = require('../data/stopwords.json');
const openfactsCategories = require('../data/categories.json');
const products = require('../data/products.json');

const stringToWorlds = (text:string) => {
  return text
    .toLowerCase()
    .replace(/[/|&;$%@"'!<>()+-.–│,“«»  ]/g, " ")
    .replace(/(l'|d'|l’|d’)/g, "")
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .split(' ').filter(word=>word.length>2);
}

const categories:string[] = [];


const tosave = products.filter(product => (product.belong && product.categories && product.photo)).map(product => {
  return {
    title: removeStopwords(stringToWorlds(product.title),fra).join(' '),
    description: removeStopwords(stringToWorlds(product.details.description),fra).join(' '),
    category: removeStopwords(stringToWorlds(product.categories.name)).join(' '),
    child: removeStopwords(stringToWorlds(product.belong.name)).join(' '),
    photo: ('https:'+product.photo.url+''+product.sku+'.jpg'),
    vendor:(product.vendor.urlpath)
  }
}).filter(product => product.title.indexOf('tomate')>-1).sort((a,b)=>{
  return a.category.localeCompare(b.category);
});


console.log(JSON.stringify(tosave,null,2));

