
// minimal format for testing purposes
import {
    DocumentProcessor, ContentPage, ContentSection, Document, FileInfos, tryToParseNumber,
    orderToLeanObject, productToLeanObject, dateBetweeThan
} from '../dist';

import { readFileSync }   from 'fs';


import 'should';

  
describe('document parser', function() {
  before(async () => {

  });

  it('convert number', function(){
    const numbers =[
        ["3 127,2","3127.2"],
        ["-3 127,2","-3127.2"],
        ["–3 127,2","-3127.2"],
        ["4 456,34","4456.34"],  
        ["4456.34","4456.34"],   
      //["1,000,000","1000.0"], 
        ["1000000.00","1000000"],
        ["1.000,01","1000.01"],  
        ["1.000,001","1000.001"],  
        ["not a number","not a number"], 
        ["12 34,56","1234.56"],  // Edge case: irregular thousand separator
        ["1 234,56","1234.56"],  
        ["1,234.56","1234.56"],   
    ];

    numbers.forEach(num => {
        const result = tryToParseNumber(num[0]);
        console.log(num[0], result);
        num[1].should.equal(result+'');
    })
  })

  it('open file', async function() {
    const filename = "./test/data/CFF_Rapport-résultat_2022.pdf";
    const data =  readFileSync(filename)
    const category = "test";
    const type="application/pdf";


    const documentProcessor = new DocumentProcessor();
    const document = await documentProcessor.createDocumentFromFile(filename, data, type, category);
    const sections = document.sections;
    for(const section of sections) {
        console.log('----',section.content)
    }




  })



});