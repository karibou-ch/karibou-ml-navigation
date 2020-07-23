var Recommender = require('likely');
var json2csv = require('json2csv');
var fs = require('fs');

console.log("Building model")

// Build the model using the training set
var model = Recommender.loadModel('model-likely.json');

console.log("Model built (DONE)")

console.log("Recommending ...")

let time=Date.now();

// E**O//2360346371241611  C**D//739049451726747  dummy
var recommendations = model.recommendations("739049451726747");
console.log("Recommendation DONE", (Date.now()-time)/1000)


recommendations.sort((a,b)=>b[1]-a[1]).slice(0, 10).forEach((r,i) => 
console.log(i,r[0],r[1].toFixed(3))
);