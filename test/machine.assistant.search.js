
// minimal format for testing purposes
require('dotenv').config();
require('should');

const parseJSON = require('../dist/lib/utils').parseJSON;
const downloadProducts = require('../dist/lib/utils').downloadProducts;
const  MachineOpenAI = require('../dist').MachineOpenAI;
const MachineIndex = require('../dist').MachineIndex;

//
// download products
const axios = require('axios');
const tiny = true;
const server = 'karibou.evaletolab.ch';


const kng_products_from_skus = async(knn,limit) => {
  const skus = knn.map(res => res.sku);
  const filename = skus[0]+skus[skus.length-1]+'';
  const products = await downloadProducts(skus,{ axios, server, tiny, name:filename, store:__dirname+'/../data' });

  //
  // use score from knn
  products.forEach(product => {
    const search = knn.find(knn=> knn.sku == product.sku);
    product.score = search.score;
  });
  const sortByScore = (a,b)=> b.score-a.score;

  const system = products.sort(sortByScore).slice(0,(limit||30)).reduce((content,item)=>{
    //console.log(`[true,'${item.title}',${item.sku}],`)
    return content += `- **${item.title}**: ${item.context}. ((${item.sku}))\n`;
  },'')+'\n';

  //const caller = "Le résultat de votre recherche.";

  return {caller:null,system, products};
}


//
// VECTORS + INFERENCE
const machine = new MachineOpenAI({
  OPENAI_API_KEY: (process.env.OPENAI_API_KEY)
});



//
// hnsw index
const RAG = new MachineIndex({
  products:[],
  vectorsfile:(__dirname+'/../data/hnswlib-openai-index.dat')
});

//
// load assistant search profile
const assistant = machine.system.search;


const system =`
${assistant.system}
${assistant.rules}
${assistant.UX}
${assistant.tools.system}
`.trim();


assistant.tools.functions.exec = async (fn,args) => {
  console.log ('--- Q.',args.query);
  const limit = 15;
  const values = await machine.openaiEmbedding(args.query);
  const knn = RAG.searchKnn(values,limit);
  const directive = "TU DOIS extraire le contexte culinaire de chaque produit et tu DOIS GARDER TOUS ceux qui correspondent."
  const prefix =`Voici une liste d'aliments pour la question "${args.query}". ${directive}\n`;
  const { system, products } = await kng_products_from_skus(knn,limit);

  const caller = prefix+system;
  return {caller, data:knn.map(res => res.sku)};
}


describe('testing rag assistant: search', function () {
  this.timeout(500000);
  before(async () => {
  });
  // Cherche des aliments saute de veau au chorizo

  it('RAG: tarte aux pommes', async () => {
    const elems =[
      [true,"chausson aux pommes",1003938],
      [false,"gnocchi de patate ",1002115],
      [false,"hollandais - 3 pcs",1003330],
      [false,"jus de pommes pasteurisé",1000569],
      [false,"pamplemousse",1002035],
      [true,"petite pomme gala",1001851],
      [true,"petite pomme jazz",1003185],
      [true,"poire abate",1001882],
      [true,"poire abate",1002907],
      [true,"poire comice",1002908],
      [true,'poire comice',1003188],
      [true,"pomme boskoop",1002045],
      [false,"pomme d’amour de boeuf ",1003726],
      [false,"pomme de terre grenaille",1002660],
      [false,"pomme de terre patate douce",1002650],
      [true,"pomme gala",1001874],
      [true,"pomme gala",1002661],
      [true,"pomme golden",1002044],
      [true,"pomme golden",1002662],
      [true,"pomme granny smith",1001887],
      [true,"pomme jazz",1003184],
      [true,"pomme pink lady",1003180],
      [true,"pomme tentation",1002034],
      [false,"tarte au saumon fumé 16cm",1003611],
      [false,"tarte au saumon fumé 20cm",1003612],
      [false,"tarte au saumon fumé 24cm",1003613],
      [false,"tarte aux noix",1002595],
      [true,"tarte fine aux pommes",1003670],
      [false,"tartelette au citron meringuée (2 pcs)",1003329],
      [false,"tartelettes aux noix (2pcs)",1003316],
      [false,"vin cuit 300g",1002572]      
    ]
    const query= "tarte aux pommes";
    try{
        const content = await assistant.tools.functions.exec('search',{query});
        const params = {
            model: assistant.model,
            debug:true,
            temperature:0.01,
            history:[{ role: "system", content:system}],
            _functions : assistant.tools.functions,
            stream:true,
            cbstream: (text,tool)=> {
              //process.stdout.write(text);
            }
        }

      const completion = await machine.openaiChat(content.caller,params);
      const results = parseJSON(completion.content.trim());
      const find = (elems.filter(elem => results.items.some(item => item==elem[2])==elem[0]));
      console.log(`RAG:test "${query}", total:`, elems.length,'got',find.length, (find.length/elems.length).toFixed(2));

      // elems.forEach(elem => {
      //   console.log((results.items.some(item => item==elem[2])==elem[0])?'✅':'❌',elem[0],elem[1])
      // });
  
    }catch(err) {
      console.log('--- ERROR ',err);
      console.log('--- ERROR ',err.ctx);
    }    
  })

  it('RAG: repas festif en famille', async () => {
    const elems =[
      [true, 'arancini maison au ragoût',1001644],
      [true, 'arancini maison aubergine',1001666],
      [true, 'assiette kefta',1004026],
      [true, 'assiette mezze végétarienne',1004028],
      [true, 'bouchée à la reine',1004582],
      [true, 'chou farci',1004491],
      [false, 'farce',1003574],
      [true, 'fatayer aux épinards - grand',1003969],
      [true, 'fatayers aux épinards',1003524],
      [false, 'flan de légumes ',1004579],
      [true, 'gratin pâtes , sauce crème et lardons',1003285],
      [true, 'lard grillé maison ',1003734],
      [true, 'lasagne viande',1001649],
      [true, 'le richelieu',1002557],
      [true, 'mini-hamburger',1003618],
      [true, 'paillasson ',1003677],
      [true, 'parmentier de boeuf',1003279],
      [false, 'plateau apéro fromage ',1004051],
      [false, 'plateau apéro fromage/charcuterie',1004052],
      [false, 'plateau dînatoire fromage/charcuterie',1004054],
      [true, 'quiche',1003291],
      [true, 'ramequin au fromage',1003615],
      [true, 'ramequin au fromage - 3pce',1004500],
      [true, 'ravioli 4 fromages',1002835],
      [true, 'ravioli artichaut persil',1002840],
      [true, 'ravioli épinards- ricotta',1002833],
      [true, 'ravioli viande',1002837],
      [true, 'risotto aux cèpes',1002826],
      [true, 'riz risotto',1002829],
      [true, 'rôti de dinde nature ou farci, label rouge',1001526],
      [true, 'rouleaux au fromage',1003780],
      [true, 'tarte fine aux pommes',1003670],
      [true, 'terrine de pot-au-feu',1001575],
      [true, 'tomate farçie maison',1000675],
      [true, 'tortellini viande de boeuf',1002452],
    ]
    const query= "repas festif en famille";
    try{
      const content = await assistant.tools.functions.exec('search',{query});
      const params = {
            model: assistant.model,
            debug:true,
            temperature:0.01,
            json:true,
            history:[{ role: "system", content:system}],
            _functions : assistant.tools.functions,
            stream:true,
            cbstream: (text,tool)=> {
              //process.stdout.write(text);
            }
        }

      // console.log('--- SYSTEM\n',system);
      const completion = await machine.openaiChat(content.caller,params);
      const results = parseJSON(completion.content.trim());
      const find = (elems.filter(elem => results.items.some(item => item==elem[2])==elem[0]));
      console.log(`RAG:test "${query}", total:`, elems.length,'got',find.length, (find.length/elems.length).toFixed(2));
      // elems.forEach(elem => {
      //   console.log((results.items.some(item => item==elem[2])==elem[0])?'✅':'❌',elem[0],elem[1])
      // });

    }catch(err) {
      console.log('--- ERROR ',err);
      console.log('--- ERROR ',err.ctx);
    }    
  })


  it('RAG: apéro avec des amis', async () => {
    const elems =[
      [true,'airelles',1002043],
      [true,'arak ksara',1003537],
      [true,'arak ksara',1003538],
      [true,'arak ksara',1003539],
      [true,'aux canards, bière acide 6.5% vol. 75cl.',1002382],
      [true,'calvi',1003891],
      [true,'champagne dehours grande réserve brut',1003838],
      [true,'coffret dégustation brasserie du mât ',1004444],
      [true,'croissant au jambon',1004431],
      [true,'doc prosecco l\'ars brut - marsuret',1002318],
      [true,'eclats de meulière, champagne j.robin à talus st prix',1000463],
      [true,'fatayer aux épinards - grand',1003969],
      [true,'fil de brume, champagne j.robin à talus st prix',1000464],
      [true,'fleur de craie, champagne barrat masson à villenauxe la grande',1000448],
      [true,'flûte au cumin',1002543],
      [true,'flûte au fromage',1002541],
      [true,'flûte au sel',1002542],
      [true,'fruit de ma passion, champagne vincent charlot tanneux',1001297],
      [false,'kirsch en 10cl',1003052],
      [true,'l\'apicole, bière au miel façon champagne, 75cl. 11.2% vol.',1004254],
      [true,'lard grillé maison ',1003734],
      [true,'limoncello bio casa barone',1002314],
      [true,'mini pâté à la viande',1003617],
      [true,'mini pâté à la viande - 4pce',1004501],
      [true,'mini-hamburger',1003618],
      [true,'mix meltingpote // 3 plainpal 3 cropette ',1004436],
      [true,'noix de cajou au curry',1004570],
      [true,'pâté cocktail de volaille et figues séchées',1002690],
      [true,'plateau apéro fromage ',1004051],
      [true,'plateau apéro fromage/charcuterie',1004052],
      [true,'plateau apéro müller',1004072],
      [true,'plateau apéro pascal',1004073],
      [true,'plateau dînatoire fromage/charcuterie',1004054],
      [true,'tarallini au fenouil',1002336],
      [true,'un air de réméjeanne ',1002844],
      
    ]
    const query= "apéro avec des amis";
    try{
      const content = await assistant.tools.functions.exec('search',{query});
      const params = {
            model: assistant.model,
            debug:true,
            temperature:0.01,
            json:true,
            history:[{ role: "system", content:system}],
            _functions : assistant.tools.functions,
            stream:true,
            cbstream: (text,tool)=> {
              //process.stdout.write(text);
            }
        }

      // console.log('--- SYSTEM\n',system);
      const completion = await machine.openaiChat(content.caller,params);
      const results = parseJSON(completion.content.trim());
      const find = (elems.filter(elem => results.items.some(item => item==elem[2])==elem[0]));
      console.log(`RAG:test "${query}", total:`, elems.length,'got',find.length, (find.length/elems.length).toFixed(2));
      elems.forEach(elem => {
        // console.log((results.items.some(item => item==elem[2])==elem[0])?'✅':'❌',elem[0],elem[1])
      });

    }catch(err) {
      console.log('--- ERROR ',err);
      console.log('--- ERROR ',err.ctx);
    }    
  })


  it('RAG: tomates', async () => {
    const elems =[
      [false,'bonn’tomme ',1002469],
      [false,'courge potimarron',1002708],
      [false,'oignon de tropea',1003604],
      [true,'pates fraiches burrata et tomates',1004274],
      [true,'poivron italien rouge ',1002127],
      [true,'poivron jaune (poids moyen 250g)',1002755],
      [true,'poivron rouge ',1001907],
      [true,'poivron rouge (poids moyen 250g)',1002753],
      [true,'poivron vert (poids moyen 250g)',1002754],
      [true,'poivrons aux thons',1002747],
      [false,'pomme de terre patate douce',1002650],
      [true,'pomodori passati petrilli 300gr',1003920],
      [true,'pomodori pelati petrilli',1003919],
      [true,'pomodoro secco',1002262],
      [true,'ravioli chèvre tomate séchée',1002834],
      [true,'salsa pronta tradizionale paolo petrilli bio 300gr',1000782],
      [true,'sauce tomate ',1001652],
      [true,'sauce tomate « datterino »',1003029],
      [true,'sauce tomate maison',1002445],
      [true,'tomate camone',1003547],
      [true,'tomate camone ',1001972],
      [true,'tomate cherry ronde',1001968],
      [true,'tomate coeur de boeuf lisse',1003585],
      [true,'tomate datterini',1001969],
      [true,'tomate datterino (d\'attarino)',1002709],
      [true,'tomate farçie maison',1000675],
      [true,'tomate grappe',1001866],
      [true,'tomate grappe',1002676],
      [true,'tomate marinda ou merinda',1003546],
      [true,'tomate mérinda',1001973],
      [true,'tomate piccadilly',1001974],
      [true,'tomate rose de berne',1002212],
      [true,'tomate san marzano',1001970],
      [true,'tomate séchée ',1001975],
      [false,'tomme aux fleurs',1004326],
      
    ]
    const query= "tomates";
    try{
      const content = await assistant.tools.functions.exec('search',{query});
      const params = {
            model: assistant.model,
            debug:true,
            temperature:0.01,
            json:true,
            history:[{ role: "system", content:system}],
            _functions : assistant.tools.functions,
            stream:true,
            cbstream: (text,tool)=> {
              //process.stdout.write(text);
            }
        }

      // console.log('--- SYSTEM\n',system);
      const completion = await machine.openaiChat(content.caller,params);
      const results = parseJSON(completion.content.trim());
      const find = (elems.filter(elem => results.items.some(item => item==elem[2])==elem[0]));
      console.log(`RAG:test "${query}", total:`, elems.length,'got',find.length, (find.length/elems.length).toFixed(2));
      // elems.forEach(elem => {
      //   console.log((results.items.some(item => item==elem[2])==elem[0])?'✅':'❌',elem[0],elem[1])
      // });

    }catch(err) {
      console.log('--- ERROR ',err);
      console.log('--- ERROR ',err.ctx);
    }    
  })


  it('RAG: tomates à cuire', async () => {
    const elems =[
      [false,'boulettes de veau ',1004334],
      [false,'citrons confits à l\'huile pimentée',1000748],
      [false,'citrons confits bio',1002860],
      [false,'courge coupée sous vide',1001978],
      [false,'courgette',1001868],
      [false,'moussaka d\'aubergines',1003511],
      [false,'pates fraiches burrata et tomates',1004274],
      [false,'piment rouge ',1002011],
      [false,'poivron rouge (poids moyen 250g)',1002753],
      [false,'poivrons aux thons',1002747],
      [false,'polenta',1002143],
      [false,'pomme de terre grenaille',1002660],
      [true,'pomodori passati petrilli 300gr',1003920],
      [true,'pomodori pelati petrilli',1003919],
      [true,'pomodoro secco',1002262],
      [true,'ravioli chèvre tomate séchée',1002834],
      [true,'salsa pronta tradizionale paolo petrilli bio 300gr',1000782],
      [true,'sauce tomate ',1001652],
      [true,'sauce tomate « datterino »',1003029],
      [true,'sauce tomate maison',1002445],
      [true,'tomate camone',1003547],
      [true,'tomate camone ',1001972],
      [false,'tomate cherry ronde',1001968],
      [false,'tomate coeur de boeuf lisse',1003585],
      [true,'tomate datterini',1001969],
      [true,'tomate datterino (d\'attarino)',1002709],
      [true,'tomate farçie maison',1000675],
      [true,'tomate grappe',1001866],
      [true,'tomate grappe',1002676],
      [true,'tomate marinda ou merinda',1003546],
      [false,'tomate mérinda',1001973],
      [false,'tomate piccadilly',1001974],
      [true,'tomate rose de berne',1002212],
      [true,'tomate san marzano',1001970],
      [true,'tomate séchée ',1001975]      
      
    ]
    const query= "tomates à cuire";
    try{
        const content = await assistant.tools.functions.exec('search',{query});
        const params = {
            model: assistant.model,
            debug:true,
            temperature:0.01,
            json:true,
            history:[{ role: "system", content:system}],
            _functions : assistant.tools.functions,
            stream:true,
            cbstream: (text,tool)=> {
              //process.stdout.write(text);
            }
        }

      // console.log('--- SYSTEM\n',system);
      const completion = await machine.openaiChat(content.caller,params);
      const results = parseJSON(completion.content.trim());
      const find = (elems.filter(elem => results.items.some(item => item==elem[2])==elem[0]));
      console.log(`RAG:test "${query}", total:`, elems.length,'got',find.length, (find.length/elems.length).toFixed(2));
      // elems.forEach(elem => {
      //   console.log((results.items.some(item => item==elem[2])==elem[0])?'✅':'❌',elem[0],elem[1])
      // });

    }catch(err) {
      console.log('--- ERROR ',err);
      console.log('--- ERROR ',err.ctx);
    }    
  })

  it('RAG: recette de la fondue moitié moitié', async () => {
    const elems =[
      [true,'fondue müller pour 2 personnes',1002575],
      [true,'fondue müller',1002573],
      [true,'mélange fondue bruand-500gr',1002997],
      [true,'mélange fondue bruand-200gr',1002998],
      [true,'mélange fondue bruand-400gr',1002996],
      [true,'raclette de chèvre au lait thermisé fribourgeoise ',1003013],
      [false,'fondue bourguignonne',1003698],
      [true,'crème double de la gruyère',1003596],
      [true,'double crème',1002574],
      [true,'raclette de chèvre coupée en tranche',1002975],
      [true,'vin blanc chasselas ',1003050],
      [false,'1/2 chaource',1004296],
      [false,'chou farci',1004491],
      [true,'meringue de fribourg par 16 pièce',1003056],
      [false,'beurre maison au confit d\'échalotes',1003565],
      [true,'raclette fumée coupée en tranche',1002972],
      [true,'raclette suisse coupée en tranche',1002970],
      [false,'bouchée à la reine',1004582],
      [false,'lard grillé maison ',1003734],
      [true,'raclette de brebis bio coupé en tranche',1002976],
      [false,'risotto aux truffes',1002828],
      [false,'maïzena 250g',1003049],
      [false,'parmentier de boeuf',1003279],
      [true,'raclette suisse',1002969],
      [false,'charbonnade boeuf/veau',1003918],
      [false,'mousse toblerone®',1003674],
      [false,'ramequin au fromage - 3pce',1004500],
      [false,'tartelette au citron meringuée (2 pcs)',1003329],
      [false,'terrine de pot-au-feu',1001575],
      [false,'crème fraîche demi aigre 250ml "smetana"',1004099],
      [true,'raclette à la truffe noire, tuber melanosporum !!!! la vraie ',1003012],
      [true,'raclette bruand fumée',1003004],
      [true,'raclette de vache à la graine de courge et curry',1003011],
      [false,'ravioli viande',1002837],
      [false,'brebis du moléson ',1002502],
          
    ]
    const query= "recette de la fondue moitié moitié";
    try{
      const content = await assistant.tools.functions.exec('search',{query});
      const params = {
          model: assistant.model,
          debug:true,
          temperature:0.01,
          json:true,
          history:[{ role: "system", content:system}],
          _functions : assistant.tools.functions,
          stream:true,
          cbstream: (text,tool)=> {
            //process.stdout.write(text);
          }
      }

      // console.log('--- SYSTEM\n',system);
      const completion = await machine.openaiChat(content.caller,params);
      const results = parseJSON(completion.content.trim());
      const find = (elems.filter(elem => results.items.some(item => item==elem[2])==elem[0]));
      console.log(`RAG:test "${query}", total:`, elems.length,'got',find.length, (find.length/elems.length).toFixed(2));
      elems.forEach(elem => {
        // console.log((results.items.some(item => item==elem[2])==elem[0])?'✅':'❌',elem[0],elem[1])
      });

    }catch(err) {
      console.log('--- ERROR ',err);
      console.log('--- ERROR ',err.ctx);
    }    
  })

});

