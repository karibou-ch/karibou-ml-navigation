const { removeStopwords, fra } = require('stopword');
const { writeFileSync } = require('fs');
const axios = require('axios');
const stringToWorlds = (text) => {
  return text
    .toLowerCase()
    .replace(/[/|&;$%@"'!<>()+-.–│,“«»  ]/g, " ")
    .replace(/(l'|d'|l’|d’)/g, "")
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .split(' ').filter(word=>word.length>2);
}

const cleanTags = (text) => {
  return text.replace(/<br>(?=(?:\s*<[^>]*>)*$)|(<br>)|<[^>]*>/gi, (x,y) => y ? ' & ' : '').slice(0, text.indexOf('.')).replace(/(\r\n|\n|\r)/gm, "")
}

const categories = [];
const category = "fromages-produits-frais";

axios.get("https://karibou.evaletolab.ch/api/v1/products/category/"+category).then(response => {
  const products = response.data;
  const tosave = products.filter(product => (product.belong && product.categories && product.photo)).map(product => {
    return {
      title: (product.title),
      description: cleanTags(product.details.description),
      category: removeStopwords(stringToWorlds(product.categories.slug)).join(' '),
      child: removeStopwords(stringToWorlds(product.belong.name)).join(' '),
      photo: ('https:'+product.photo.url+''+product.sku+'.jpg'),
      vendor:(product.vendor.urlpath)
    }
  }).sort((a,b)=>{
    return a.category.localeCompare(b.category);
  });

  tosave.forEach(product => console.log('* ',product.title,':',product.description))
  
  writeFileSync("./products-"+category+".json", JSON.stringify(tosave,null,2), 'utf8');
})




