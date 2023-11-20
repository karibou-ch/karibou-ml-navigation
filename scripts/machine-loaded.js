const MachineIndex = require('../dist/').MachineIndex;
const memoryUsage = require('../dist/').memoryUsage;
const readline = require("readline");


memoryUsage('loading model');


const cli = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "\n> ",
});

const time=Date.now();

// E**O//2360346371241611  C**D//739049451726747   dummy
// machine.load(__dirname).then((model)=>{
const machine=MachineIndex.load('../karibou-api/machine','karibou.ch');

memoryUsage('loaded');




// searching k-nearest neighbor data points.
const start= async(cli)=> {
  cli.prompt();
  cli.on("line", async (line) => {
    if(line=='exit') {
      process.exit();
    }
    if(line.indexOf('help')>-1) {
      console.log('users,vendors,categories,rating <uid>')
    }
    if(line.indexOf('users')>-1) {
      console.log(machine.usersList)
      machine.usersList.forEach(user => console.log(user));
    }

    if(line.indexOf('vendors')>-1) {
      machine.vendorsList.forEach(vendor => console.log(vendor));
    }

    if(line.indexOf('categories')>-1) {
      machine.categoriesList.forEach(cat => console.log(cat.name,cat.max,cat.min,cat.avg));
    }

    if(line.indexOf('ratings')>-1) {
      const params = line.split(' ').map(elem => elem.trim()); 
      console.log('-- ratings',params[1]);
      machine.ratings(params[1]).forEach(rate => {
        const prod=machine.products.find(p=>p.sku==rate.item);
        console.log('   ',rate.score.toFixed(2),prod.title||prod.sku);
      })
    }

    cli.prompt();
  });
}

//739049451726747
//anonymous
start(cli);

