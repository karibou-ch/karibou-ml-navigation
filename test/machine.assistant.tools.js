
// minimal format for testing purposes
require('dotenv').config();
require('should');
const parseJSON = require('../dist/lib/utils').parseJSON;
const natural = require('natural');

const {
  MachineOpenAI,
  MachineIndex
} = require('../dist');


const machine = new MachineOpenAI({
  OPENAI_API_KEY: (process.env.OPENAI_API_KEY)
});

//
// load assistant profiles
const assistant = machine.system.recipesmall;

const system =`
${assistant.system}
${assistant.rules}
${assistant.UX}
${assistant.tools.system}

`;

const temperature = .601;
const model = assistant.model;
const debug = false;
//const model = 'gpt-4-turbo-preview';
//const model = 'gpt-3.5-turbo';
//const model = 'gpt-4-turbo-preview';
//# Voici quelques ingrédients auxquels TU DOIS extraire le contexte culinaire puis GARDER TOUS ceux (au moins 10 produits aléatoirement) qui correspondent à la question précédente.


describe('testing assistant tool: ', function () {
  this.timeout(500000);
  before(async () => {
  });

  it('chat: recettes "Cuisine Française" **AVEC*** une liste de produit du "tool"', async () => {
    const query= 'les 5 meilleures recettes de "Cuisine Française" (tu DOIS produire un résultat de 20 mots)';

    const RAG_theme_cuisine_fr = `
    # Tu DOIS ABSOLUMENT suivre tes "directives de la gestion des recettes" pour proposer les meilleures plats de "Cuisine Française".
      Les  ingérients de karibou.ch ne sont pas obligatoire, ils NE doivent jamais aller contre les solutions de ta connaissance.
    - **[filet mignon de porc](/sku/1000004)**; boucherie-artisanale; cochon; Vendeur "boucherie-jacky-bula"; Prix 26fr /~500gr
    - **[mini croissant au beurre](/sku/1000060)**; boulangerie-artisanale; viennoiserie et boulangerie sucrée; Vendeur "boulangerie-leonhard-bretzel"; Prix 45fr /30pce
    - **[escalope de veau](/sku/1000300)**; boucherie-artisanale; boeuf, veau; Vendeur "boucherie-jacky-bula"; Prix 14fr /~180gr
    - **[filet mignon de porc, jambon cru, et farce](/sku/1000321)**; boucherie-artisanale; cochon; Vendeur "boucherie-jacky-bula"; Prix 37.7fr /~650gr
    - **[magnum réserve 4 cépages, champagne barbichon à gyé sur seine](/sku/1000454)**; champagnes; champagnes; Vendeur "mademoiselle-bulles"; Prix 106fr /1.5 L
    - **[moutarde forte au sauternes](/sku/1000745)**; huiles-vinaigre-condiments; moutardes; Vendeur "boucherie-jacky-bula"; Prix 14fr /200gr
    - **[quasi de veau simmental](/sku/1001212)**; boucherie-artisanale; boeuf, veau; Vendeur "boucherie-jacky-bula"; Prix 35fr /~500gr
    - **[panettone traditionnel](/sku/1001400)**; douceurs-chocolats; panettone; Vendeur "casa-mozzarella"; Prix 26fr /500 gr
    - **[cuisse de poulet, allier](/sku/1001518)**; boucherie-artisanale; volaille, lapin; Vendeur "volaille-estevez-r"; Prix 7.55fr /~280gr
    - **[cuisse de lapin de la loire](/sku/1001527)**; boucherie-artisanale; volaille, lapin; Vendeur "volaille-estevez-r"; Prix 7.25fr /~230gr
    - **[caille des dombes désossée farcie, label rouge](/sku/1001532)**; boucherie-artisanale; canard, caille; Vendeur "volaille-estevez-r"; Prix 9.9fr /1pce
    - **[pâté en croûte de canard](/sku/1001554)**; charcuterie-pates; pâté & terrine; Vendeur "volaille-estevez-r"; Prix 8.25fr /~150gr
    - **[oignon jaune](/sku/1001911)**; aliments végétaux; ail, oignons, échalottes; Vendeur "famille-benoit-primeur"; Prix 2.3fr /500 gr
    `;
    
    try{
      const history = [{ role: "system", content:system}];
      const params = { model, debug, temperature, history, functions : assistant.tools.functions,
        cbstream_:(text) => { process.stdout.write(text) }
      }


      assistant.tools.functions.exec = async (fn,args) => {
        console.log(' --- GAME tools',fn,args);
        should.exist(args.purpose);
        args.purpose.should.equal('recette');
        return {caller:RAG_theme_cuisine_fr};
      }

      const completion = await machine.openaiChat(query,params);
      console.log('tools result:', completion.content, '');

    }catch(err) {
      console.log('--- ERROR ',err.message, err.ctx);
    }
  });  


  it('chat: recettes "Cuisine Française" **SANS** une liste de produit du "tool"', async () => {
    const query= 'les 5 meilleures recettes de "Cuisine Française" (tu DOIS produire un résultat de 20 mots)';

    const RAG_theme_cuisine_fr = `ignore ce résultat externe et utilises uniquement tes connaissances intégrées pour répondre.
    `;
    
    try{
      const history = [{ role: "system", content:system}];
      const params = { model, debug, temperature, history, functions : assistant.tools.functions,
        cbstream_:(text) => { process.stdout.write(text) }
      }


      assistant.tools.functions.exec = async (fn,args) => {
        console.log(' --- GAME tools',fn,args);
        return {caller:RAG_theme_cuisine_fr};
      }

      const completion = await machine.openaiChat(query,params);
      console.log('tools result:', completion.content, '');

    }catch(err) {
      console.log('--- ERROR ',err.message, err.ctx);
    }
  });

  // Issue 'sauce soja' and 'wasabi' 
  //Cherche des aliments pour 'Sashimi Japonais'


  //
  it('tool_search: prépare un panier de fruits diversifiés et de saison de 5 kg', async () => {
    const query= 'prépare un panier de fruits diversifiés et de saison de 5 kg';

    const RAG_theme_cuisine_fr = `ignore ce résultat externe et utilises uniquement tes connaissances intégrées pour répondre.
    `;
    
    try{
      const history = [{ role: "system", content:system}];
      const params = { model, debug, temperature, history, functions : assistant.tools.functions,
        cbstream_:(text) => { process.stdout.write(text) }
      }


      assistant.tools.functions.exec = async (fn,args) => {
        console.log(' --- GAME tools',fn,args);

        throw (args.ingredients.lenght > 4)?"OK":("KO-"+args.ingredients[0]);
      }

      const completion = await machine.openaiChat(query,params);
      console.log('tools result:', completion.content, '');

    }catch(err) {
      console.log('--- RESULT',err);
    }
  });

  it('chat: détail de la recette ratatouille libanaise', async () => {
    const query= 'les ingrédients de la recette ratatouille libanaise (tu DOIS produire un résultat de 60 mots)';

    const RAG_theme_cuisine_fr = `ignore ce résultat externe et utilises uniquement tes connaissances intégrées pour répondre.
    `;
    
    try{
      const history = [{ role: "system", content:system}];
      const params = { model, debug, temperature, history, functions : assistant.tools.functions,
        cbstream_:(text) => { process.stdout.write(text) }
      }


      assistant.tools.functions.exec = async (fn,args) => {
        console.log(' --- GAME tools',fn,args);
        return {caller:RAG_theme_cuisine_fr};
      }

      const completion = await machine.openaiChat(query,params);
      console.log('tools result:', completion.content, '');

    }catch(err) {
      console.log('--- ERROR ',err.message, err.ctx);
    }
  });


  it('chat: recettes avec des produits populaires est-ce que tu fais appels à un "tool"', async () => {
    const query= 'les 5 meilleures noms de recettes avec des produits populaires (résultat uniquement avec une liste de noms séparés par une virgule)';
    try{
      const history = [{ role: "system", content:system}];
      const params = { model, debug, temperature, history, functions : assistant.tools.functions,
        cbstream_:(text) => { process.stdout.write(text) }
      }

      assistant.tools.functions.exec = async (fn,args) => {
        console.log(' --- OK',fn,args);
        return { caller: "Oeufs, Tomates, Boeuf, Champagne"};
      }

      const completion = await machine.openaiChat(query,params);
      console.log('5 recettes avec des produits populaires:', ( completion.content));

  
    }catch(err) {
      // console.log('--- ERROR ',err.message);
      console.log('--- ERROR ',err);
    }
  });  

  xit('chat: 3 recettes pour fêter la naissance de Steve Jobs', async () => {
    const query= 'Une recette pour fêter la naissance de Steve Jobs (résultat uniquement avec une liste de noms séparés par une virgule)';
    try{
      const history = [{ role: "system", content:system}];
      const params = { model, debug, temperature, history, functions : assistant.tools.functions,
        cbstream_:(text) => { process.stdout.write(text) }
      }

      assistant.tools.functions.exec = async (fn,args) => {
        console.log(' --- OK',fn,args);
        return { caller: "Oeufs, Tomates, Boeuf, Champagne"};
      }

      const completion = await machine.openaiChat(query,params);
      console.log('fêter la naissance de Steve Jobs', ( completion.content));

  
    }catch(err) {
      // console.log('--- ERROR ',err.message);
      console.log('--- ERROR ',err);
    }
  });  

});

