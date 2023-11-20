"use strict";
const assert   = require('assert');
const fs       = require('fs');
const natural  = require('natural');


const { OpenAI } = require("openai");
const { HierarchicalNSW } = require('hnswlib-node');




//
// vector, matrix and geometry library
export class MachineOpenAI{

  domain;
  embedding;
  chatmodel;
  timestamp;

  vectorsfile;
  vectorsindex;
  system;
  assistant;
  temperature;
  space;  
  openai;
  OPENAI_API_KEY;

  //
  // options
  // - system
  // - assistant
  // - space (1536)
  constructor(options){


    // model
    this.embedding=options.embedding||'text-embedding-ada-002';
    this.chatmodel=options.chatmodel||'gpt-4';
    this.temperature = options.temperature || 0.8;
    this.space=options.space||1536;
    this.system=options.system;
    this.assistant=options.assistant;
    this.timestamp=options.timestamp || Date.now();
    this.domain=options.domain||'karibou.ch';
    this.vectorsfile=options.vectorsfile;
    this.OPENAI_API_KEY = options.OPENAI_API_KEY;

    if(!this.OPENAI_API_KEY) {
      throw new Error("OpenAI key is not available");
    }

    //
    // load index
    if(fs.existsSync(this.vectorsfile)) {
      this.vectorsindex = new HierarchicalNSW('l2', this.space);
      this.vectorsindex.readIndexSync(this.vectorsfile);
    }



    this.openai = new OpenAI({
      apiKey: options.OPENAI_API_KEY,
    });
    
    console.log('--- DATE',this.timestamp);

  }

  loadVectors() {
    // 
    // load cache if file exist and release memory as soon as possible;
    let vectors = {};
    try{
      let data = fs.readFileSync(this.vectorsfile+'.json', 'utf8');
      vectors = JSON.parse(data);
    }catch(err) {}

    //
    // update timestamp
    vectors['timestamp'] = this.timestamp;
    return vectors;
  }

  //
  // create vector search indexer
  indexKnn(vectors) {
    const space = this.space; // the length of data point vector that will be indexed.
    const items = Object.keys(vectors);
    const maxElements = items.length; // the maximum number of data points.


    // declaring and intializing index.
    const index = this.vectorsindex = new HierarchicalNSW('l2', space);
    console.log('init vectors index for ',maxElements,'entries');
    index.initIndex(maxElements);

    for(let item of items){    
      if(item == 'timestamp') {continue}
      index.addPoint(vectors[item],+item );
    }

    //
    // save KNN and the source
    index.writeIndexSync(this.vectorsfile);
    fs.writeFileSync(this.vectorsfile+'.json', JSON.stringify(vectors,null,2), 'utf8');
  }

  //
  // user vector KNN search
  searchKnn(vectors, neighbors) {
    neighbors = neighbors|| 30;

    if(!this.vectorsindex) {
      throw new Error("KNN service is not available");
    }

    const result = this.vectorsindex.searchKnn(vectors, neighbors);
    if(!result||!result.neighbors||!result.neighbors.length) {
      return [];
    }

    return result.neighbors;
  }

  async openaiChat(text, cbstream) {
    const messages = [{ role: "user", content: text }];

    if(this.assistant) {
      messages.unshift({ role: "assistant", content:this.assistant })
    }
    if(this.system) {
      messages.unshift({ role: "system", content:this.system })
    }

    const stream = await this.openai.chat.completions.create({
      model: this.chatmodel,
      stream:true,
      messages,          
      temperature: this.temperature
    });
    const content = await openaiChunkiterator(stream,cbstream);
    return content;
  }


  async openaiEmbedding(text) {

    //
    // gpt-embdding
    const embedding = await this.openai.embeddings.create({
      model: this.embedding,
      input: text,
      encoding_format: "float",
    });
  
    const listOfVectors = embedding.data[0].embedding;
    return listOfVectors;
  }

}

//
// private stuffs
const openaiChunkiterator = async(stream, cbstream) => {
  let content ="";
  for await (const completion of stream) {
    if(!completion.choices[0].delta.content) {
      continue;
    }
    content +=  completion.choices[0].delta.content;
    cbstream(completion.choices[0].delta.content);
  }

  return content;
}
