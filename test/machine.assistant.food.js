
// minimal format for testing purposes
require('dotenv').config();
require('should');
const parseJSON = require('../dist/lib/utils').parseJSON;
const natural = require('natural');


const  MachineOpenAI = require('../dist').MachineOpenAI;


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
`;

//console.log(system);
const temperature = .601;
const model = assistant.model;
const debug = true;
//const model = 'gpt-4-turbo-preview';
//const model = 'gpt-4-1106-preview';
describe('testing assistant: alignement', function () {
  this.timeout(500000);
  before(async () => {
  });

//**Mini croissant au beurre** et **panettone traditionnel**

  it('chat: check la sélection du plat "Mini croissant au beurre et panettone traditionnel" (should score <=0.5)', async () => {
    const query= "est-ce que le plat suivant  'Mini croissant au beurre et panettone traditionnel' est quelque chose que tu pourrais proposer?  (répondre en JSON avec le champ 'score' entre 0 et 1 de ton choix)";
    
    try{
      const history = [{ role: "system", content:system}];
      const params = { model, debug, temperature, history }
      const data = await machine.openaiChat(query,params);
      const answer = parseJSON( data.content);

      console.log('Mini croissant au beurre et panettone traditionnel:', answer);
      answer

    }catch(err) {
      console.log('--- ERROR ',err.message);
      console.log('--- ERROR ',err.ctx);
    }
  });

  it('chat: check la sélection du plat "Mini croissant au beurre et panettone traditionnel" avec un input RAG (should score <=0.5)', async () => {
    const query= "est-ce que le plat suivant  'Mini croissant au beurre et panettone traditionnel' est quelque chose que tu pourrais proposer?  (répondre en JSON avec le champ boolean 'selection')";

    const RAG_theme_cuisine_fr = `
    # code mémoire de la liste (lst-739049451726747-search-cuisine française raffinée)
    # Voici des d'ingérients de karibou.ch pour la recherche "Cuisine Française".
      TU DOIS extraire le contexte culinaire de chaque produit et tu DOIS GARDER TOUS ceux qui correspondent à la question (au moins 5 produits).
      Tu DOIS utiliser ton expertise en gastronomie et nutrition pour augmenter la qualité de la réponse et créer des repas équilibrés.  
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
      const history = [{ role: "system", content:system},{ role: "assistant", content:RAG_theme_cuisine_fr}];
      const params = { model, debug, temperature, history }
      const data = await machine.openaiChat(query,params);
      const answer = parseJSON( data.content);

      console.log('Mini croissant au beurre et panettone traditionnel:', answer);
      answer

    }catch(err) {
      console.log('--- ERROR ',err.message);
      console.log('--- ERROR ',err.ctx);
    }
  });

  it('chat: check Bavette Grillée à la Schüblig est une bonne association (should score <=0.3)', async () => {
    const query= "Est-ce que 'la Bavette Grillée à la Schüblig' est une bonne recette à proposer (répondre en JSON avec le champ boolean 'selection')";
    try{
      const history = [{ role: "system", content:system}];
      const params = { model, debug, temperature, history }
      const data = await machine.openaiChat(query,params);
      console.log('Bavette Grillée à la Schüblig ', parseJSON( data.content));
  
    }catch(err) {
      console.log('--- ERROR ',err.message);
      console.log('--- ERROR ',err.ctx);
    }
  });

  it('chat: check Fondue au fromage avec mix de raclettes et pain au levain (should score <=0.3)', async () => {
    const query= "Est-ce que la Fondue au fromage avec mix de raclettes et pain au levain est une combinaison pour un repas (répondre en JSON avec le champ boolean 'selection')";
    try{
      const history = [{ role: "system", content:system}];
      const params = { model, debug, temperature, history }
      const data = await machine.openaiChat(query,params);
      console.log('Fondue au fromage avec mix de raclettes ', parseJSON( data.content));
  
    }catch(err) {
      console.log('--- ERROR ',err.message);
      console.log('--- ERROR ',err.ctx);
    }
  });
  it('chat: check Burger à la Schüblig et tomate farcie est une recette a proposer?', async () => {
    const query= "Est-ce que le Burger à la Schüblig et tomate farcie est une recette a proposer (répondre en JSON avec le champ boolean 'selection')";
    const prefix ="Voici une liste de produits populaires\n";
    const test = `${prefix}
    * Pâté maison (1000010)
    * Véritable Schüblig artisanale de St-Gall (1000231)
    * Tomate farçie maison (1000675)
    * Ste-Pastule 33cl. Bière blonde (1001266)
    * Vermeilleuse 33cl. Bière ambrée (1001267)
    * Carotte (1001859)
    * Pomme de terre Agria (1001862)
    * Avocat (1001895)
    * Echalote banane (1001917)
    * Tomate Piccadilly (1001974)
    * Dinde panée Label Rouge (1002152)
    * Pain pur levain (1002412)
    * Bavette (1000003)
    
    `
    try{
        const history = [{ role: "system", content:system},{ role: "assistant", content:test}];
        const params = { model, debug, temperature, history }
        const data = await machine.openaiChat(query,params);
        console.log('Burger à la Schüblig et tomate farcie ', parseJSON( data.content));
  
    }catch(err) {
      console.log('--- ERROR ',err.message);
      console.log('--- ERROR ',err.ctx);
    }
  });


  it('chat: check Fondue savoyarde (A) vs fondue fribourgeoise (B)(should score <=0.5)', async () => {
    const query= "Tu dois choisir entre deux recettes, la Fondue Savoyarde (A) ou la Fondue Fribourgeoise (B) (répondre en JSON avec les champs 'A','B' et les valeurs entres 0 et 1 de ton choix)";
    try{
      const history = [{ role: "system", content:system}];
      const params = { model, debug, temperature, history }
      const data = await machine.openaiChat(query,params);
      const answer = parseJSON( data.content);
      console.log('savoyarde vs fribourgeoise:', answer);
  
    }catch(err) {
      console.log('--- ERROR ',err.message);
      console.log('--- ERROR ',err.ctx);
    }
  });

  xit('chat: Pour une recette de crêpes normandes salées quelle association tu choisis (should score >0.7)', async () => {
    const query= "Pour des crêpes normandes salées quelle association tu choisis 'poitrine fumée', 'tranches de bacon' ou 'lardons fumés' (répondre en JSON avec les champs 'A','B','C' et les valeurs entres 0 et 1 de ton choix )";
    try{
      const history = [{ role: "system", content:system}];
      const params = { model, debug, temperature, history }
      const data = await machine.openaiChat(query,params);
      console.log('association crêpes normandes:', parseJSON( data.content));
  
    }catch(err) {
      console.log('--- ERROR ',err.message);
      console.log('--- ERROR ',err.ctx);
    }
  });

  xit('chat: les 10 meilleures recettes de la thématique "apéritif gourmand"',async ()=> {
    const query= "les 10 meilleures recettes de la thématique 'apéritif gourmand' (répondre en JSON strict avec 10 noms de recettes et leur score entre 0 et 1)";
    try{
      const history = [{ role: "system", content:system}];
      const params = { model, debug, temperature, history }
      const data = await machine.openaiChat(query,params);
      console.log('apéritif gourmand:', parseJSON( data.content));
  
    }catch(err) {
      console.log('--- ERROR ',err.message);
      console.log('--- ERROR ',err.ctx);
    }

  })

  xit('chat: lorsque que tu proposes 10 recettes combien seront de saisons',async () =>{
    const query= "lorsque que tu proposes 10 recettes combien seront de saisons (répondre avec le nombre de recettes divisées par 10 comme score entre 0 et 1 en JSON)";
    try{
      const history = [{ role: "system", content:system}];
      const params = { model, debug, temperature, history }
      const data = await machine.openaiChat(query,params);
      console.log('recettes de saisons ', parseJSON( data.content));
  
    }catch(err) {
      console.log('--- ERROR ',err.message);
      console.log('--- ERROR ',err.ctx);
    }

  })



  xit('chat: check proteins and themas', async () => {
    const query= "quelles sont les thématiques et aliments protéiques que tu choisis pour créer un plan hebdomadaire équilibrer (répondre en JSON strict)";
    const prefix ="Voici une liste de produits de mes précédentes commandes\n";
    const test = `${prefix}
    * Pain pur levain (1002412)
    * Lait entier Genevois UHT (1002880)
    * Beurre de fromagerie (1002883)
    * Pomme de terre grenaille (1001867)
    * Banane bio (1001957)
    * Domaine de la Mermière Kern Blanc 2021 (1002232)
    * Salami de Parme (1002530)
    * Lardo iberico (1003933)
    * Pommes "Gala" bio (1004450)
    * Poires "Uta" bio (1004521)
    * Raclette Suisse (1002969)
    * Raclette fumée coupée en tranche (1002972)
    * Raclette de chèvre coupée en tranche (1002975)
    * Raclette de brebis Bio coupé en tranche (1002976)
    * Raclette de vache à la graine de courge et curry (1003011)
    * Raclette à la truffe noire, Tuber melanosporum !!!!  La vraie  (1003012)
    * Pâté en croûte de canard (1001554)
    * IGT Puglia ''Puro'' 2022 - Michele Biancardi (1002321)
    * Rillettes de canard (1002438)
    * Galet de Chorizo (1002605)
    * Beurre de fromagerie (1002883)
    * Pain de NICOLAS au levain (1003871)
    * Morbier (1004092)
    * sapalet (1004277)
    * Coppa (1004304)
    * Coffret Dégustation Brasserie du Mât  (1004444)
        
    `
    try{
      const history = [{ role: "system", content:system},{ role: "assistant", content:test}];
      const params = { model, debug, temperature, history }
      const data = await machine.openaiChat(query,params);
    console.log('parse JSON ', data.total_tokens);
      console.log('parse JSON ', data.content);
  
    }catch(err) {
      console.log('--- ERROR ',err.message);
      console.log('--- ERROR ',err.ctx);
    }
  });


});

