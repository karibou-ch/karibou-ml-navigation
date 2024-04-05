
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
const globalTemp = .01;
const globalModel = assistant.model;
//const globalModel = 'gpt-4-turbo-preview';
//const globalModel = 'gpt-4-1106-preview';
describe('testing assistant: markdown', function () {
  this.timeout(500000);
  before(async () => {
  });


  it('chat: avec la thématique "Cuisine Française" est-ce que tu génères un lien', async () => {
    const query= "je dis la thématique 'Cuisine Française' réponds en écho avec ou sans la transformation markdown";
    try{
        const messages = [];
        messages.push({ role: "system", content:system});
        const params = {
            model: globalModel,
            debug:false,
            temperature:globalTemp,
            history:messages
        }


      const completion = await machine.openaiChat(query,params);
      const data = (completion);
      //console.log('markdown:', ( data.content.trim()));
      data.content.should.containEql('(/theme/cuisine_française)')
  
    }catch(err) {
      console.log('--- ERROR ',err.message);
      console.log('--- ERROR ',err.ctx);
    }
  });

  it('chat: avec la "Tomate Piccadilly ((12345))" est-ce que tu créés un lien markdown?', async () => {
    const query= "je dis '[Tomate Piccadilly](/sku/12345)' réponds en écho avec ou sans la transformation markdown";
    try{
        const messages = [];
        messages.push({ role: "system", content:system});
        const params = {
            model: globalModel,
            debug:false,
            temperature:globalTemp,
            history:messages
        }


      const completion = await machine.openaiChat(query,params);
      const data = (completion);
      //console.log('markdown:', ( data.content.trim()));
      data.content.should.containEql('(/sku/12345')

  
    }catch(err) {
      console.log('--- ERROR ',err.message);
      console.log('--- ERROR ',err.ctx);
    }
  });

  it('chat: avec la "Tomate Piccadilly" est-ce que tu créés un lien markdown?', async () => {
    const query= "je dis 'Tomate Piccadilly' réponds en écho avec ou sans la transformation markdown";
    try{
        const messages = [];
        messages.push({ role: "system", content:system});
        const params = {
            model: globalModel,
            debug:false,
            temperature:globalTemp,
            history:messages
        }


      const completion = await machine.openaiChat(query,params);
      const data = (completion);
      //console.log('markdown:', ( data.content.trim()));
      data.content.should.not.containEql('(/sku')

    }catch(err) {
      console.log('--- ERROR ',err.message);
      console.log('--- ERROR ',err.ctx);
    }
  });

  it('chat: avec le "Boeuf Bourguignon" ou la "Quiche Lorraine" est-ce que tu génères un lien markdown?', async () => {
    const query= "je dis 'Boeuf Bourguignon' et 'Quiche Lorraine', réponds en écho les même noms avec ou sans la transformation markdown";
    try{
        const messages = [];
        messages.push({ role: "system", content:system});
        const params = {
            model: globalModel,
            debug:false,
            temperature:globalTemp,
            history:messages
        }


      const completion = await machine.openaiChat(query,params);
      const data = (completion);
      //console.log('markdown:', ( data.content.trim()));
      data.content.should.not.containEql('/sku')

    }catch(err) {
      console.log('--- ERROR ',err.message);
      console.log('--- ERROR ',err.ctx);
    }
  });

  it('chat: avec la "Plateau de fruits de mer" est-ce que tu créés un lien markdown?', async () => {
    const query= "je dis 'Plateau de fruits de mer' réponds en écho le même nom avec ou sans la transformation markdown";
    try{
        const messages = [];
        messages.push({ role: "system", content:system});
        const params = {
            model: globalModel,
            debug:false,
            temperature:globalTemp,
            history:messages
        }


      const completion = await machine.openaiChat(query,params);
      const data = (completion);
      //console.log('markdown:', ( data.content.trim()));
      data.content.should.not.containEql('(/sku')

    }catch(err) {
      console.log('--- ERROR ',err.message);
      console.log('--- ERROR ',err.ctx);
    }
  });


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
  //           debug:false,
  //           temperature:globalTemp,
  //           history:messages
  //       }


  //     const completion = await machine.openaiChat(query,params);
  //     const data = (completion);
  //     console.log('parse JSON ', data.total_tokens);
  //     console.log('parse JSON ', data.content.trim());
  
  //   }catch(err) {
  //     console.log('--- ERROR ',err.message);
  //     console.log('--- ERROR ',err.ctx);
  //   }
  // });




});

