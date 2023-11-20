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
    const [call, p1,p2,p3] = line.split(' ').map(elem => elem.trim()); 

    if(call=='help') {
      console.log('users,vendors,categories,rating <uid>')
    }
    
    // E**O//2360346371241611  C**D//739049451726747 M**R//1099354922508877  K**L 1847885976581568
    if(call == 'users') {
      console.log(machine.usersList)
      machine.usersList.forEach(user => console.log(user));
    }

    if(call == 'vendors') {
      machine.vendorsList.forEach(vendor => console.log(vendor));
    }

    if(call == 'cats') {
      machine.categoriesScore.forEach(cat => console.log(cat.name,cat.max,cat.min,cat.avg));
    }

    if(call == 'ratings') {

      console.log('-- ratings',p1,p2,p3,machine.categoriesWeight);
      const opts = {        
      }
      p2 && (opts.categories = p2);
      machine.ratings(p1,30,opts).forEach(rate => {
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

