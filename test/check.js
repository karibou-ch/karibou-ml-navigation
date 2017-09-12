var should = require('should');
var products = require('./data/products');
var orders = require('./data/orders.json');
describe('verify JSON', function() {
  it('orders should be an Array', function() {
    orders.should.be.an.Array();    
  });
  it('products should be an Array', function() {
    products.should.be.an.Array();    
  });
  
});