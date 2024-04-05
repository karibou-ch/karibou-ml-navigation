//
//
// export API
import natural from 'natural';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const sentenceTokenizer = new natural.SentenceTokenizer();


export const time = (ttl) => {
  return new Promise(res => {
    setTimeout(res,ttl||100);
  });  
}

export const cleanTags = (text) => {
  return text.replace(/<br>(?=(?:\s*<[^>]*>)*$)|(<br>)|<[^>]*>/gi, (x, y) => y ? ' & ' : '').replace(/(\r\n|\n|\r)/gm, "");//.slice(0, text.indexOf('.'))
}

export const dateInMonths = (when) => {
  const onemonth=86400000*30;
  const today = Date.now();
  //
  // time lapse in months
  return ((today-when.getTime())/onemonth);
}

export const dateBetweeThan=(date,weeks)=>{
  let now=new Date();
  date = new Date(date);
  return datePlusDays(date,weeks*7)>now;
}

export const datePlusDays=(date,nb) => {
  const plus=new Date(date);
  plus.setDate(date.getDate()+nb);
  return plus;
}

export const memoryUsage = (info)=> {
  // require('v8').getHeapStatistics().heap_size_limit
  const format = (data) => `${Math.round(data / 1024 / 1024 * 100) / 100} MB`;

  const memoryData = process.memoryUsage();

  const memoryUsage = {
    heapTotal: `${format(memoryData.heapTotal)} -> total size allocated heap`,
    heapUsed: `${format(memoryData.heapUsed)} -> heap used for ${info}`
  };  
  console.log('--- heap',memoryUsage.heapTotal);
  console.log('--- heap',memoryUsage.heapUsed);
  return memoryUsage;
}


export const orderToLeanObject = (order) => {
  const obj = {
    customer: {
      id: order.customer.id,
      likes: order.customer.likes,
      plan:order.customer.plan,
    },
    items: order.items,
    shipping: {
      when: (order.shipping.when.$date ? new Date(order.shipping.when.$date) : new Date(order.shipping.when))
    }
  }
  return obj;
}

// Lean product, 
//"sku": "F",
//"title":"produit FF",
//"description": "description FF",
//"categories": "c2",
//"vendor": "v2",
//"created": "2020-11-03T23:00:00.000Z",
//"updated": "2022-11-03T23:00:00.000Z",
//"discount": false,
//"boost": true,
//"photo": "//ucarecdn.com/cd1b24c5-3f2d-461d-9562-2eb3c1d7f1a2/"
//

export const productToLeanObject = (product) => {
  const regex = /(.+?[.;:])/;

  //
  // category
  const mapper = {
    'fruits-legumes':' '
  }

  //
  // category
  const categoriesToString = (product)=> {
    let categories = product.categories;
    if (!categories)
      return {categories:'none',context:''};
    if (typeof categories.slug == 'string' ){
      categories = categories.slug;
    }
    else if (product.categories._id){
      categories =  product.categories._id.toString();      
    }
      

    //
    // format categories
    categories = categories.toLocaleLowerCase();  
    let context = (mapper[categories]||categories);
    context = (product.belong&&product.belong.name||context).toLocaleLowerCase();
    return {categories,context};
  }

  //
  // tags
  if(!product.details) {
    const pricing = product.pricing?{price:product.pricing.price,part:product.pricing.part}:{};
    const tags = product.tags||[];
    const obj = {
      sku: product.sku,
      title: product.title.toLocaleLowerCase().replace(/\s\s+/g, ' '),
      description: product.description.replace(/\s\s+/g, ' '),
      pricing,
      boost:product.boost,
      discount:product.discount,
      categories:product.categories,
      vendor:product.vendor,
      created:(product.created && new Date(product.created)),
      updated:(product.updated && new Date(product.updated)),
      tags,
      context:product.categories
    }
    return obj;
  }
  let tags="";
  if(product.details.biodynamics||product.details.bio||product.details.bioconvertion){    
    tags=" bio organique organic biodynamie naturel biodynamics";
  }
  if(product.details.vegetarian){    
    tags+=" vegetarian végétarien";
  }

  if(product.details.gluten){    
      tags+=" gluten glutenfree sans-gluten";
  }

  if(product.details.lactose){    
      tags+=" lactose sans-lactose";
  }

  if(product.details.grta){
      tags+=" grta local";
  }

  if(product.details.gastronomy){
    tags+=" gastro gastronomy gastronomie finefood gourmet";
  }

  if(product.details.handmade) {
    tags+=" handmade Fait-main artisanal";
  }
  if(product.details.homemade) {
    tags+=" homemade fait-maison artisanal";
  }
  tags = tags.split(' ').map(tag => tag.trim()).join(',');

  const {categories, context} = categoriesToString(product);


  //
  // context
  const vendor = (product.vendor?.urlpath || product.vendor);
  const discount = !!product.attributes.discount;
  const boost = !!product.attributes.boost;
  const description = cleanTags(product.details.description).toLocaleLowerCase().replace(/\s\s+/g, ' ');
  const short = sentenceTokenizer.tokenize(description);
  const pricing = {price:product.pricing.price,part:product.pricing.part};

  const obj = {
    sku: product.sku,
    title: product.title.toLocaleLowerCase().replace(/\s\s+/g, ' '),
    description: (short.length?short[0]:description),
    pricing,
    boost,
    discount,
    categories,
    vendor,
    created:(product.created && new Date(product.created)),
    updated:(product.updated && new Date(product.updated)),
    tags,
    context  
  };
  return obj;
}

export const parseJSON = (text) => {
  text = text.trim();
  const json1 = /\{([^{}]+)\}|\[([^[\]]+)\]/gi.exec(text); 
  if(!json1) {
    const err = new Error("JSON")
    err['ctx'] = text;
    throw err;
  }
  return JSON.parse(`${json1[0]}`);
}

export const downloadProducts = async (skus, options)=>{
  if(options.store && options.name){
    const file = options.store+'/products-'+options.name+'.json';
    if(existsSync(file)) {
      return JSON.parse(readFileSync(file,{encoding:'utf-8'}));
    }
  }

  const saveCache = (products) => {
    if(options.store && options.name){
      const file = options.store+'/products-'+options.name+'.json';
      const content = JSON.stringify(products,null,0);
      writeFileSync(file,content);
    }  
    return products;
  }

  const query = skus.join('&skus=');
  const url = `https://${options.server}/api/v1/products?skus=${query}`;
  const response = await options.axios.get(url);
  const products = response.data ||[];
  if(!options.tiny) {
    return saveCache(products.sort(sortByTitle));
  }
  return saveCache(products.map(productToLeanObject).sort(sortByTitle));
}


//
// private api
const sortByTitle = ((a,b)=>{
  return a.title.localeCompare(b.title);
})