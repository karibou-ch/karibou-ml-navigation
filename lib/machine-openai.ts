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
  vectorsdistance;
  inmemory;
  system;
  assistant;
  temperature;
  space;  
  openai;
  OPENAI_API_KEY;
  debug;
  //
  // options
  // - system
  // - assistant
  // - space (1536)
  constructor(options){


    // model
    this.embedding=options.embedding||'text-embedding-ada-002';
    this.chatmodel=options.chatmodel||'gpt-4';
    this.temperature = options.temperature || 0.45;
    this.inmemory = options.inmemory
    this.space=options.space||1536;
    this.system=options.system;
    this.assistant=options.assistant;
    this.timestamp=options.timestamp || Date.now();
    this.domain=options.domain||'karibou.ch';
    this.vectorsdistance=options.vectorsdistance||'l2';
    this.vectorsfile=options.vectorsfile;    
    this.OPENAI_API_KEY = options.OPENAI_API_KEY;
    this.debug = options.debug;
    if(!this.OPENAI_API_KEY) {
      throw new Error("OpenAI key is not available");
    }

    //
    // load index
    // https://github.com/nmslib/hnswlib
    // https://github.com/yoshoku/hnswlib-node

    if(fs.existsSync(this.vectorsfile)) {
      this.vectorsindex = new HierarchicalNSW(this.vectorsdistance, this.space);
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

  indexKnnGetPoints(label) {
    if(!this.vectorsindex) {
      throw new Error("KNN service is not available");
    }
    return this.vectorsindex.getPoint(label);
  }

  //
  // create vector search indexer
  indexKnn(vectors, opts?) {
    opts = opts || { };
    const space = this.space; // the length of data point vector that will be indexed.
    const items = Object.keys(vectors);
    const maxElements = items.length; // the maximum number of data points.


    // declaring and intializing index.
    const index = this.vectorsindex = new HierarchicalNSW(this.vectorsdistance, space);
    console.log('init vectors index for ',maxElements,'entries');

    // https://github.com/nmslib/hnswlib/blob/master/ALGO_PARAMS.md
    // initIndex(maxElements, m?, efConstruction?, randomSeed?, allowReplaceDeleted?): void
    // (elem,16, 200,100)
    index.initIndex(maxElements, (opts.m||32), (opts.ef||400));

    for(let item of items){    
      if(item == 'timestamp') {continue}
      index.addPoint(vectors[item],+item );
    }

    if(this.inmemory) {
      return;
    }
    //
    // save KNN and the source
    index.writeIndexSync(this.vectorsfile);
    fs.writeFileSync(this.vectorsfile+'.json', JSON.stringify(vectors,null,2), 'utf8');
  }

  resetKnn() {
    this.vectorsindex = new HierarchicalNSW(this.vectorsdistance, this.space);
  }

  //
  // user vector KNN search
  // return {sku,score}
  searchKnn(vectors, neighbors) {
    neighbors = neighbors|| 40;

    if(!this.vectorsindex) {
      throw new Error("KNN service is not available");
    }

    const result = this.vectorsindex.searchKnn(vectors, neighbors);
    if(!result||!result.neighbors||!result.neighbors.length) {
      return [];
    }
    const skus = result.neighbors;
    const arrscore = result.distances.map(s => parseFloat((1-s).toFixed(2)));
    if(this.debug)console.log('---- DBG KNN search distance',arrscore);

    return skus.map((sku,idx)=> ({sku,score:(arrscore[idx])}));
  }

  async openaiChat(text, cbstream) {
    const messages = [{ role: "user", content: text }];

    if(this.assistant) {
      messages.unshift({ role: "assistant", content:this.assistant })
    }
    if(this.system) {
      messages.unshift({ role: "system", content:this.system })
    }

    // Température (0.0 - 0.3) :
    //     Caractéristiques : Des réponses très cohérentes, logiques et prévisibles. Peu de variation entre les réponses.
    //     Utilisation : Convient lorsque vous avez besoin de réponses très fiables et constantes.

    // Température Moyenne (0.4 - 0.7) :
    //     Caractéristiques : Un bon équilibre entre cohérence et créativité. Permet une certaine variabilité tout en restant généralement fiable.
    //     Utilisation : Idéal si vous voulez une certaine variation dans les réponses sans sacrifier trop de cohérence.

    // Température (0.8 - 1.0) :
    //     Caractéristiques : Réponses plus aléatoires et créatives, avec une plus grande variabilité.
    //     Utilisation : Moins prévisible, peut générer des réponses uniques et intéressantes mais parfois moins fiables.

    // response_format:{ "type": "json_object" },
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
