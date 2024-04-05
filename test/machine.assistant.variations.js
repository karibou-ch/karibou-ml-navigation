
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
${assistant.rules}

`;

//console.log(system);
const globalTemp = .601;
const globalModel = assistant.model;
//const globalModel = 'gpt-4-turbo-preview';
//const globalModel = 'gpt-4-1106-preview';
describe('testing assistant: variations', function () {
  this.timeout(500000);
  before(async () => {
  });


  it('chat: combien de recettes "Cuisine Française"  "', async () => {
    const query= 'si je dis les meilleures recettes "Cuisine Française" combien tu en as à disposition (résultat du nombre sans autre commentaire)';
    try{
        const messages = [];
        messages.push({ role: "system", content:system});
        const params = {
            model: globalModel,
            debug:true,
            temperature:globalTemp,
            history:messages,
        }

      let completion;let list;let dist =0;
      completion = await machine.openaiChat(query,params);
      list = completion.content;
      console.log(completion.content,'\nTRY 2');
      
  
    }catch(err) {
      console.log('--- ERROR ',err.message, err);
    }
  });


  it('chat: valider les variations lorsque je demande 10 recettes "Cuisine Française" "', async () => {
    const query= 'les 10 meilleures noms de recettes "Cuisine Française" (tu DOIS produire uniquement la liste des 10 noms séparés par une virgule et sans introduction)';
    try{
        const messages = [];
        messages.push({ role: "system", content:system});
        const params = {
            model: globalModel,
            debug:true,
            temperature:globalTemp,
            history:messages,
        }

      const refss="Boeuf Bourguignon Coq au Vin Ratatouille Cassoulet";
      let completion;let dist =0;
      // try
      completion = await machine.openaiChat(query,params);
      completion.content = completion.content.slice(0,50).replace(/[-\n,]/gm,'');
      dist = natural.JaroWinklerDistance(completion.content,refss,{ignoreCase:true});
      console.log('distance <.7', dist, completion.content, '');
      dist.should.be.below(0.8);

      // try
      completion = await machine.openaiChat(query,params);
      completion.content = completion.content.slice(0,50).replace(/[-\n,]/gm,'');
      dist = natural.JaroWinklerDistance(completion.content,refss,{ignoreCase:true});
      console.log('distance <.7', dist, completion.content, '');
      dist.should.be.below(0.8);

      // try
      completion = await machine.openaiChat(query,params);
      completion.content = completion.content.slice(0,50).replace(/[-\n,]/gm,'');      
      dist = natural.JaroWinklerDistance(completion.content,refss,{ignoreCase:true});
      console.log('distance <.7',  dist, completion.content,'');
      dist.should.be.below(0.8);

      // try
      completion = await machine.openaiChat(query,params);
      completion.content = completion.content.slice(0,50).replace(/[-\n,]/gm,'');      
      dist = natural.JaroWinklerDistance(completion.content,refss,{ignoreCase:true});
      console.log('distance <.7',  dist, completion.content,'');
      dist.should.be.below(0.8);

  
    }catch(err) {
      console.log('--- ERROR ',err.message, err);
    }
  });


  it('chat: valider les variations lorsque je demande les MEILLEURES recettes "Cuisine Française" "', async () => {
    const query= 'les meilleures noms de recettes en "Cuisine Française" (tu DOIS produire uniquement la liste des noms séparés par une virgule et sans introduction)';
    try{
        const messages = [];
        messages.push({ role: "system", content:system});
        const params = {
            model: globalModel,
            debug:true,
            temperature:globalTemp,
            history:messages,
        }

      const refss="Boeuf Bourguignon Coq au Vin Ratatouille Cassoulet";
      let completion;let dist =0;
      // try
      completion = await machine.openaiChat(query,params);
      completion.content = completion.content.slice(0,50).replace(/[-\n,]/gm,'');
      dist = natural.JaroWinklerDistance(completion.content,refss,{ignoreCase:true});
      console.log('distance <.7', dist, completion.content, '');
      dist.should.be.below(0.8);

      // try
      completion = await machine.openaiChat(query,params);
      completion.content = completion.content.slice(0,50).replace(/[-\n,]/gm,'');
      dist = natural.JaroWinklerDistance(completion.content,refss,{ignoreCase:true});
      console.log('distance <.7', dist, completion.content, '');
      dist.should.be.below(0.8);

      // try
      completion = await machine.openaiChat(query,params);
      completion.content = completion.content.slice(0,50).replace(/[-\n,]/gm,'');      
      dist = natural.JaroWinklerDistance(completion.content,refss,{ignoreCase:true});
      console.log('distance <.7',  dist, completion.content,'');
      dist.should.be.below(0.8);

      // try
      completion = await machine.openaiChat(query,params);
      completion.content = completion.content.slice(0,50).replace(/[-\n,]/gm,'');      
      dist = natural.JaroWinklerDistance(completion.content,refss,{ignoreCase:true});
      console.log('distance <.7',  dist, completion.content,'');
      dist.should.be.below(0.8);

  
    }catch(err) {
      console.log('--- ERROR ',err.message, err);
    }
  });  
  xit('chat: je veux une recette pour célébrer la naissance de Steve Jobs', async () => {
    const query= "je souhaite une recette pour célébrer la naissance de Steve Jobs (répondre avec un score entre 0 et 1 en JSON pour 2 choix de résultat)";
    try{
        const messages = [];
        messages.push({ role: "system", content:system});
        const params = {
            model: globalModel,
            debug:true,
            temperature:globalTemp,
            history:messages
        }


      const completion = await machine.openaiChat(query,params);
      const data = (completion);
      console.log('célébrer la naissance de Steve Jobs:', parseJSON( data.content.trim()));
  
    }catch(err) {
      console.log('--- ERROR ',err.message);
      console.log('--- ERROR ',err.ctx);
    }    
  })

  xit('chat: je veux une recette pour célébrer la date 15 Février, pour Galen (129): Médecin grec de l\'Antiquité', async () => {
    const query= "je souhaite une recette pour célébrer la date 15 Février, pour Galen (129) (répondre avec un score entre 0 et 1 en JSON pour le nom des le nom des 2 choix de résultat)";
    try{
        const messages = [];
        messages.push({ role: "system", content:system});
        const params = {
            model: globalModel,
            debug:true,
            temperature:globalTemp,
            history:messages
        }


      const completion = await machine.openaiChat(query,params);
      const data = (completion);
      console.log('célébrer la date 15 Février:', ( data.content));
  
    }catch(err) {
      console.log('--- ERROR ',err.message);
      console.log('--- ERROR ',err.ctx);
    }    
  })

  xit('chat: aujourd\'hui c\'est une belle journée de printemps que me proposes-tu?', async () => {
    const query= "aujourd\'hui c\'est une belle journée que me proposes-tu? (répondre avec un score entre 0 et 1 en JSON pour le nom des 2 choix de résultat)";
    try{
        const messages = [];
        messages.push({ role: "system", content:system});
        const params = {
            model: globalModel,
            debug:true,
            temperature:globalTemp,
            history:messages
        }


      const completion = await machine.openaiChat(query,params);
      const data = (completion);
      console.log('une belle journée de printemps:', ( data.content));
  
    }catch(err) {
      console.log('--- ERROR ',err.message);
      console.log('--- ERROR ',err.ctx);
    }    
  })



  // xit('chat: check produits 5 recettes', async () => {
  //   const query= "5 noms de recettes (une liste de noms en TLDR;)";
  //   const prefix ="Voici une liste de produits de mes précédentes commandes\n";
  //   const test = `${prefix}
  //   * Pain pur levain (1002412)
  //   * Lait entier Genevois UHT (1002880)
  //   * Beurre de fromagerie (1002883)
  //   * Pomme de terre grenaille (1001867)
  //   * Banane bio (1001957)
  //   * Domaine de la Mermière Kern Blanc 2021 (1002232)
  //   * Salami de Parme (1002530)
  //   * Lardo iberico (1003933)
  //   * Pommes "Gala" bio (1004450)
  //   * Poires "Uta" bio (1004521)
  //   * Raclette Suisse (1002969)
  //   * Raclette fumée coupée en tranche (1002972)
  //   * Raclette de chèvre coupée en tranche (1002975)
  //   * Raclette de brebis Bio coupé en tranche (1002976)
  //   * Raclette de vache à la graine de courge et curry (1003011)
  //   * Raclette à la truffe noire, Tuber melanosporum !!!!  La vraie  (1003012)
  //   * Pâté en croûte de canard (1001554)
  //   * IGT Puglia ''Puro'' 2022 - Michele Biancardi (1002321)
  //   * Rillettes de canard (1002438)
  //   * Galet de Chorizo (1002605)
  //   * Beurre de fromagerie (1002883)
  //   * Pain de NICOLAS au levain (1003871)
  //   * Morbier (1004092)
  //   * sapalet (1004277)
  //   * Coppa (1004304)
  //   * Coffret Dégustation Brasserie du Mât  (1004444)
        
  //   `
  //   try{
  //       const messages = [];
  //       messages.push({ role: "system", content:system});
  //       messages.push({ role: "assistant", content:test});
  //       const params = {
  //           model: globalModel,
  //           debug:true,
  //           temperature:globalTemp,
  //           history:messages
  //       }


  //     const completion = await machine.openaiChat(query,params);
  //     const data = (completion);
  //     console.log('parse JSON ', data.total_tokens);
  //     console.log('parse JSON ', data.content);
  
  //   }catch(err) {
  //     console.log('--- ERROR ',err.message);
  //     console.log('--- ERROR ',err.ctx);
  //   }
  // });




});

