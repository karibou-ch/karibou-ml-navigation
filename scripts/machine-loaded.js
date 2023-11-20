const MachineIndex = require('../dist/').MachineIndex;
const readline = require("readline");

const customers = orders.map(order=>order.customer).filter((elem, pos, arr) => {
  return arr.findIndex(a=>a.id==elem.id) == pos;
});

console.log("loading model")


const cli = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "\n> ",
});

const time=Date.now();

// E**O//2360346371241611  C**D//739049451726747   dummy
// machine.load(__dirname).then((model)=>{
const model=MachineIndex.load('./machine/karibou.ch.model.json');




// searching k-nearest neighbor data points.
const start= async(cli)=> {

  cli.prompt();
  cli.on("line", async (line) => {
    if(line=='exit') {
      process.exit();
    }
    if(line.indexOf('users')>-1) {
      machine.usersList.forEach(user => console.log(user));
    }

    if(line.indexOf('vendors')>-1) {
      machine.vendorsList.forEach(vendor => console.log(vendor));
    }

    if(line.indexOf('categories')>-1) {
      machine.categoriesList.forEach(cat => console.log(cat));
    }

    if(line.indexOf('ratings')>-1) {
      const params = line.split(' ').map(elem => elem.trim()); 
      console.log('-- ratings',params[1]);
      model.ratings(params[1]).forEach(rate => {
        const prod=model.products.find(p=>p.sku==rate.item);
        console.log('   ',rate.score.toFixed(2),prod.title);
      })
    }

    console.log('\n');
    cli.prompt();
  });
}

//739049451726747
//anonymous
start();

