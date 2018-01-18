var Recommender = require('likely');
var json2csv = require('json2csv');
var fs = require('fs');

var orders = require('../test/data/orders.json');
  
//Traversing orders to find the distinct list of customers and products
var customers = []
var products = []
var customerProducts = {}
orders.forEach(element => {
	let ps = element.customer.pseudo;
	if(customers.indexOf(ps) == -1){
		customers.push(ps)
	}
	element.items.forEach(item => {
		if(products.indexOf(item.title) == -1){
			products.push(item.title);
		}
	})
});

products = products.slice(0, 200)

customers.push("dummy")
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
		let pseudoid = customers.indexOf(element.customer.pseudo);
		let productid = products.indexOf(item.title);
		if(productid != -1)
			matrix[pseudoid][productid]++;
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

console.log("Model built (DONE)")

console.log("Recommending ...")

var recommendations = model.rankAllItems("dummy");
console.log("Recommendation DONE")

console.log(recommendations)

recommendations.forEach(r => 
console.log(r[0] + "\t" + r[1]))