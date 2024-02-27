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

export const productToLeanObject = (product) => {
  const regex = /(.+?[.;:])/;

  const mapper = {
    'fruits-legumes':'aliments végétaux'
  }

  //
  // tags
  const isLean = !product.details;
  let tags="";
  if(!isLean) {
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
      tags+=" handmade Fait main artisanal";
    }
    if(product.details.homemade) {
      tags+=" homemade fait maison artisanal";
    }
    tags = tags.trim().split(' ').join(',');
  }


  //
  // category
  const categoriesToString = (product)=> {
    if (!product.categories)
    return 'none';
    if (typeof product.categories.slug == 'string' )
        return product.categories.slug;
    if (product.categories._id)
        return product.categories._id.toString();
    return product.categories.toString();
  }



  let categories = categoriesToString(product).toLocaleLowerCase();
  let context = mapper[categories]||categories;

  if(categories && product.belong && product.belong.name){
    context = (context+'; '+product.belong.name).toLocaleLowerCase();
  }

  //
  // context
  const vendor = isLean ? (product.vendor||''):(product.vendor?.urlpath ? product.vendor.urlpath: product.vendor);
  const discount = (isLean?product.discount:product.attributes.discount);
  const boost = (isLean?product.boost:product.attributes.boost);
  const description = cleanTags(product.description||product.details.description).toLocaleLowerCase().replace(/\s\s+/g, ' ');
  const short = sentenceTokenizer.tokenize(description);

  const obj = {
    sku: product.sku,
    title: product.title.toLocaleLowerCase().replace(/\s\s+/g, ' '),
    description: (short.length?short[0]:description),
    boost,
    discount,
    categories,
    vendor,
    created:(product.created && new Date(product.created)),
    updated:(product.updated && new Date(product.updated)),
    tags,
    context  
  };
  //
  // text: (product.title + ' (' + tags.join(',') + ') (description):' + description + ')').replace('()', '')

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