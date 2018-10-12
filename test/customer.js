var should = require('should');
var products = require('./data/products');
var orders = require('./data/orders.json');
var moment = require('moment');
var Customers = require('../lib/customers');

describe('customer info issue#7', function() {

  this.timeout(5000)
  
  var indexCustomer=709;//Math.random()*(orders.length-1)|0;
  var customer=orders[indexCustomer].customer;
  //console.log('-------------',Customers) 
  var customers=new Customers(orders);
  it('prapare data orders:'+orders.length, function() {
    should.exists(customer)

    //
    // init all users
    customers.allUsers().forEach(customer=>customers.compute(customer.id,customer.pseudo));
    customers.getAll()
    console.log('--> customers',customers.getAll().length)
  });


  it('orders frequency + issues', function(done) {
    console.log('#\n#,pseudo, frequency 12m/6m/3m/1m, issue by shop\n#');
    customers.getAll().forEach((customer,i)=>{
      if(i>20)return;
      var cid=customers.get(customer);
      var issues=Object.keys(cid.issues).sort((a,b)=> cid.issues[b]-cid.issues[a]).map(issue=>{
        return issue.substr(0,5)+':'+cid.issues[issue];
      })
      console.log(i,cid.pseudo,
                  '--> Y/S/Q/M',cid.freqs.year,cid.freqs.semester,cid.freqs.quarter,cid.freqs.month,
                  'bug',issues.join(','))
    })
    
    done();
  });



  it.skip('orders issue', function(done) {
    /**
     * {vendor-name:count} 
     * 
     */    
    customers.getAll().forEach(customer=>{
      var cid=customers.get(customer)
      console.log('--> ',cid.issues.total)
    })
    //console.log('-->',customers.get(customer.id).issues)
    
    done();   
  });

  it.skip('customer likes', function(done) {
    products.should.be.an.Array();   
    var likes={
      max: Math.max.apply(Math,selected.map(function(s){return s.customer.likes.length;})),
      current: customer.likes.length
    }

    console.log('-->',likes)
    
    done(); 
  });
  
});