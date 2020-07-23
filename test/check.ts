import 'should';

import products from './data/products.json';
import orders from './data/orders.json';
describe('verify JSON', function() {
  it('orders should be an Array', function() {
    (orders).should.be.an.Array();    
  });
  it('products should be an Array', function() {
    (products).should.be.an.Array();    
  });
  
});