
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


describe('testing assistant tool for quotes: ', function () {
  this.timeout(500000);
  before(async () => {
  });



  //
  it('tool_quotes: je souhaite des exemples pour un événement dans une entreprise', async () => {
    const query= 'je souhaite des exemples pour un événement dans une entreprise';
    
    try{
      const history = [{ role: "system", content:system}];
      const params = { model, debug, temperature, history, functions : assistant.tools.functions,
        cbstream_:(text) => { process.stdout.write(text) }
      }


      assistant.tools.functions.exec = async (fn,args) => {
        console.log(' --- GAME tools',fn,args);
        return {caller:assistant.quotes};
      }

      const completion = await machine.openaiChat(query,params);
      console.log('tools result:', completion.content, '');

    }catch(err) {
      console.log('--- RESULT',err);
    }
  });  
});

