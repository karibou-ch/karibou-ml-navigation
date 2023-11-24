
// minimal format for testing purposes
import $products from './data/products-xs.json';
import $orders from './data/orders-xs.json';


const MachineIndex = require('../lib').MachineIndex;
const MachineCreate = require('../lib').MachineCreate;
const orderToLeanObject = require('../lib').orderToLeanObject;
const productToLeanObject = require('../lib').productToLeanObject;
const dateBetweeThan = require('../lib').dateBetweeThan;


import 'should';


// (?:\*\*.*\*\*\s*:\s*)? ==>  ne pas capturer le bold du markdown ** text **
// (?:[^:\n]*:\s*)? ==> Un groupe non capturant 
const parseContent = (content) => {
  const regex = /^\s*[-]\s*(?:[^:\n]*:\s*)?\s*(.+)$/gm;
  let matches;
  let items:string[] = [];
  
  while ((matches = regex.exec(content)) !== null) {
      const line = matches[1] as string;
      if(!line.trim().length) {
          continue;
      }
      items.push(line);
  }  
  return items;
}
  
describe('chat tools', function() {
  before(async () => {

  });

  it('parse one line A', async () => {    
    const content = `
    Apéritif gourmand: Tartare de saumon

    - Apéritif: Choisissez du saumon frais de qualité, de préférence bio ou label rouge.
    - Coupez le saumon en dés fins.
    - Mélangez avec de l'avocat mûr coupé en dés et un peu de jus de citron vert.
    - Assaisonnez avec du sel, du poivre, et un filet d'huile d'olive.
    - Servez frais avec des toasts ou des blinis.
    `

    const items = parseContent(content);
    items.length.should.eql(5);
    items[4].should.eql('Servez frais avec des toasts ou des blinis.')

  });

  it('parse one line B', async () => {    
    const content = `
    **Cuisine de la mer**

    - Apéritif: Tartare de saumon, toasts de rillettes de thon
    - Jour 1 Déjeuner: Salade de poulpe, vinaigrette au citron
    - Jour 1 Goûter: Crevettes cocktail
    - Jour 3 Dîner: Bouillabaisse traditionnelle
    - Apéritif: Sélection de vins blancs ou bières légères
    
    Bonne dégustation avec ces saveurs maritimes !    `

    const items = parseContent(content);
    console.log(items)
    items.length.should.eql(5);
    items[1].should.eql('Salade de poulpe, vinaigrette au citron')
  });


  it('',async function(){
    const content = `
    Tarte au Saumon

    - Préchauffer le four à 180°C.
    - Étaler une pâte brisée dans un moule à tarte.
    - Dans un bol, mélanger des œufs, de la crème fraîche, du sel et du poivre.
    - Ajouter du saumon fumé coupé en morceaux et de l'aneth haché au mélange.
    - Verser le tout sur la pâte et cuire au four pendant environ 30 minutes.
    - Servir chaud avec une salade verte pour un déjeuner ou dîner délicieux.    `
  })


  
  it('parse recipes', async () => {    
    const recipes = `
    **Jour 1 - Apéritif gourmand**
    - Tartare de saumon frais
    - Crevettes cocktail
    - Verre de vin blanc ou bière légère
    
    **Jour 2 - Cuisine rapide et facile**
    - Salade de poulpe avec citron et persil
    - Pain croustillant
    - Limonade maison    
    `
      

  });


});