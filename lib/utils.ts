//
//
// export API


export const cleanTags = (text) => {
  return text.replace(/<br>(?=(?:\s*<[^>]*>)*$)|(<br>)|<[^>]*>/gi, (x, y) => y ? ' & ' : '');//.slice(0, text.indexOf('.')).replace(/(\r\n|\n|\r)/gm, "")
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
  const tags: string[] = [];
  const isLean = !product.details;
  const bio = !isLean && (    
    product.details.bio ||
    product.details.biodynamics ||
    product.details.bioconvertion
  ) || (product.bio);

  if ((!isLean) && (bio)) {
    tags.push('bio');
  }
  if ((!isLean) && (product.details.homemade || product.details.handmade)) {
    tags.push('artisanal');
  }
  if ((!isLean) && (!bio) && (product.details.natural) || (product.naturel)) {
    tags.push('naturel');
  }

  const categories = isLean? product.categories:(product.categories ? product.categories.slug:'orphan');
  const vendor = isLean ? (product.vendor||''):(product.vendor.urlpath ? product.vendor.urlpath: product.vendor);
  const discount = (isLean?product.discount:product.attributes.discount);
  const boost = (isLean?product.boost:product.attributes.boost);
  let description = cleanTags(product.description||product.details.description);
  const obj = {
    sku: product.sku,
    title: product.title,
    description,
    categories,
    vendor,
    created:product.created,
    updated:product.updated,
    discount,
    boost,
    text: (product.title + ' (' + tags.join(',') + ') (description):' + description + ')').replace('()', '')
  };
  return obj;
}
