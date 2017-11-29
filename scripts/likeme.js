var Recommender = require('likely.js');

var rowLabels = ['John', 'Sue', 'Joe'];
var colLabels = ['Red', 'Blue', 'Green', 'Purple'];

// Build the model using the training set
var model = Recommender.buildModel(trainingSet, rowLabels, colLabels);

// Calculate the error from the produced model against the CV set of known values
var totalError = Recommender.calculateTotalError(model.estimate, crossValidationSet);

//
var recommendations = model.recommendations('John');
var allItems = model.rankAllItems('John');
