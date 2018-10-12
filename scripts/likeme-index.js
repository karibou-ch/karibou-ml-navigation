var Recommender = require('likely');
var json2csv = require('json2csv');
var fs = require('fs');

var orders = require('../test/data/orders.json');
var allproducts = require('../test/data/products.json');
	
function saveFile(output){
  var content = JSON.stringify(output,0,2);
  fs.writeFile("model-likely.json", content, 'utf8', function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("The file was saved!");
  }); 
}


//Traversing orders to find the distinct list of customers and products
var customers = []
var products = []
var customerProducts = {}
orders.forEach(element => {
	let ps = element.customer.id;
	if(customers.indexOf(ps) == -1){
		customers.push(ps)
	}
	element.items.forEach(item => {
		if(products.indexOf(item.sku) == -1){
			products.push(item.sku);
		}
	})
});

//products = products.slice(0, 50)
// E**O//2360346371241611  C**D//739049451726747
customers.push("dummy");
console.log("customers " , customers.length , " example [", customers[0] , ", " , customers[1] , " ...")
console.log("products " , products.length , " example [", products[0] , ", " , products[1] , " ...")

//Initializing an empty matrix with n rows for customers and m columns for products found
var matrix = [];
for(var i=0; i<customers.length; i++) {
    matrix[i] = [];
    for(var j=0; j<products.length; j++) {
        matrix[i][j] = 0;
    }
}

//Building matrix with customer x products with values of orders
orders.forEach(element => {
	element.items.forEach(item => {
		let pseudoid = customers.indexOf(element.customer.id);
		let productid = products.indexOf(item.sku);
		let allp=allproducts.find(p=>p.sku==item.sku);
		
		if(productid != -1){
			matrix[pseudoid][productid]++;

		// 
		// mega boost 
		if(allp.discount||allp.natural||allp.local){
				matrix[pseudoid][productid]+=2;
			}
		}
			
	})
});

//Save to file
var logger = fs.createWriteStream('matrix.tsv');
logger.write("customer\t" + products.join("\t") + "\n")
for(var i=0; i<customers.length; i++) {
	logger.write(customers[i] + "\t" + matrix[i].join("\t") + "\n")
}
logger.end()


console.log("Building model")

// Build the model using the training set
var model = Recommender.buildModel(matrix, customers, products);

saveFile(model);

console.log("Model built (DONE)")

console.log("Recommending ...")

var recommendations = model.rankAllItems("dummy");
console.log("Recommendation DONE")


recommendations.forEach(r => 
console.log(r[0] + "\t" + r[1].toFixed(3))
);