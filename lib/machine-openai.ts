"use strict";

import { strict as assert } from 'assert';
import { time } from "./utils";

import { OpenAI } from "openai";
import { accessSync, constants, readdirSync } from "fs";




//
// vector, matrix and geometry library
export class MachineOpenAI{

  domain;
  embedding;
  chatmodel;
  timestamp;



  temperature;
  openai;
  OPENAI_API_KEY;
  debug;
  appRoot;
  //
  // options
  // - system
  // - assistant
  // - space (1536)
  constructor(options){


    const plug = '/../system';
    for (const path of module.paths) {
      try{
        accessSync(path+plug,constants.F_OK);
        this.appRoot = path+plug;
        break;
      }catch(err) {}
    }

    
    // model
    // https://platform.openai.com/docs/models/gpt-4-and-gpt-4-turbo
    this.embedding=options.embedding||'text-embedding-3-small';
    this.chatmodel=options.chatmodel||'gpt-4';
    this.temperature = options.temperature || 0.45;
    this.timestamp=options.timestamp || Date.now();
    this.domain=options.domain||'karibou.ch';
    this.OPENAI_API_KEY = options.OPENAI_API_KEY;
    this.debug = options.debug;
    if(!this.OPENAI_API_KEY) {
      throw new Error("OpenAI key is not available");
    }



    this.openai = new OpenAI({
      apiKey: options.OPENAI_API_KEY,
    });
    
    console.log('--- DATE',this.timestamp);

  }

  //
  // open system configurations 
  get system() {
    if(!this.appRoot) throw new Error('Missing system setup');
    //
    // load system assistants
    const assistant = {};
    readdirSync(this.appRoot).forEach(file => {
      if (file.indexOf(".js") == -1 || file == "index.js") {
        return;
      }
      assistant[file.replace('.js', '')]= require(this.appRoot+ '/' + file);
    });
    
    return assistant;
  }


  // DEPRECATED
  // opts {cbstream, functions, history }
  //  - cbstream use fn(text) if you need streamed results
  //  - functions describe the API accessible from the agent
  //  - history is the messages context
  async openaiChat(text, opts ) {
    opts = opts || {};
    const history:any[] = opts.history || [];

    //
    // append the request
    history.push({ role: "user", content: text })

    //
    // initial setup for this chat
    if(history[0].role!=='system') {
      if(opts.assistant) {
        history.unshift({ role: "assistant", content:opts.assistant })
      }
  
      if(opts.system) {
        history.unshift({ role: "system", content:opts.system })
      }  
    }

    //
    // ready to go
    const messages = history.slice();

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

    const params:any = {
      model: opts.model||this.chatmodel,
      messages,          
      temperature: opts.temperature||this.temperature
    }
    if(opts.max_tokens) {
      params.max_tokens = opts.max_tokens;
    }
    //
    // case of function
    if(opts.cbstream) {
      params.stream = true;
    } else {
      opts.cbstream =()=> {};
    }
    //
    // case of function
    if(opts.functions) {
      const choice = (Number.isInteger(opts.functions.choice)) ? opts.functions.context[opts.functions.choice]:'auto';
      params.tools = opts.functions.context;
      params.tool_choice = choice;
    }

    //
    // cas of JSON
    if(opts.json) {
      params.response_format = { type: "json_object" };
    }

    //
    // select stream or atomic function
    const stream = params.stream?
                (await this.openai.beta.chat.completions.stream(params)):(await this.openai.chat.completions.create(params));
    const assistant = await openaiChunkedIterator(stream,opts.cbstream);    
    if(assistant.usage){
      if(this.debug) console.log('--- DBG openai usage',assistant.usage);
      delete assistant.usage;
    }

    //
    // fonction call
    const parseJson = (str) => {
      try{ 
        const json = decodeURIComponent(str);
        return JSON.parse(json) 
      }catch(e){ return{}; }
    };

    if(assistant.tool_calls) {
      //
      // assistant request tool action FIXME use std API
      history.push(assistant);
      params.messages.push(assistant);
      // TODO data is not implemented 
      const data=[];
      let lastFN;

      for(const tool_call of assistant.tool_calls) {
        const _fn = tool_call.function.name;
        const _args = tool_call.function.arguments;
        if(!lastFN)opts.cbstream('',{function:_fn,status:'exec'});
        lastFN= _fn; //last fn
        const {caller, system, data } = await opts.functions.exec(_fn,parseJson(_args));


        //
        // TODO data is not implemented 
  
        //
        // new system prompt that clarifies the assistant's role
        if(system){
          history[0].content+=system;
          params.messages[0].content+=system;
        }
  
        const stack = {
          tool_call_id: tool_call.id,
          role: "tool",
          name: _fn,
          content: caller||'',
        }; 

  
        history.push(stack);
        params.messages.push(stack);  
      }

      //
      // extend conversation with function
      // If caller is not an empty ""
      const tools_result = {... params};  
      delete tools_result.tools;
      delete tools_result.tool_choice;
      if (opts.functions.params) {
        Object.assign(tools_result,opts.functions.params)
      }

      const stream = await this.openai.beta.chat.completions.stream(tools_result);            
      //
      // no-stream
      // message = stream.choices[0].message;
      if(opts.debug){
        console.log("-- DBG tools results (START)");
      }
      const message = await openaiChunkedIterator(stream,opts.cbstream);
      delete message.usage;
      history.push(message);    
      //
      // send data
      opts.cbstream('',{function:lastFN,status:'end',data});
      if(opts.debug){
        console.log("\n-- DBG tools results (END)")
      }

      return message;
    }
    // 
    // memory for this chat
    else{
      history.push({ role: 'assistant', content:assistant.content });    
    }

    return assistant;
  }



  //
  // cancel running Job
  async assistantCancel(params) {
    if(!params.run || !params.thread) {
      throw new Error("Incomplet signature");
    }

    const run = await this.openai.beta.threads.runs.cancel(params.thread,params.run);
    return run;
  }


  //
  // get history for this assistant instance 
  async assistantThread(id) {
    const messages = await this.openai.beta.threads.messages.list(id);
    return messages;
  }

  async assistantClear(id) {
    try{
      await this.openai.beta.threads.del(id);
    }catch(err) {}
  }

  async assistantIsRunning(params) {
    const run = await this.openai.beta.threads.runs.retrieve(params.thread,params.run);
    if(this.debug) console.log('--- DBG isRunning',run.status);
    return ['queued', 'in_progress', 'requires_action'].indexOf(run.status)>-1;
  }

  async assistantWaitForContent(run){
    let isRunning;
    do{
      await time(1000);
      isRunning = await this.assistantIsRunning(run);
    } while(isRunning);
    const messages = await this.assistantThread(run.thread);
    if(!messages.data.length) {
      return [];
    }
    const content = messages.data.map(msg => ({role:msg.role,content:msg.content[0]}))
    return content[0];
  }
  //
  // use assistant
  // 0. params.assistant 
  //    params.user
  //    params.thread
  //    (params.run) (params.instruction) (params.model)
  // 1. params.thread && params.run
  // return run job (id,thread_id)
  async assistant(params) {
    let run:any=null;
    let isrunning=false;

    if(params.debug != undefined){
      this.debug = params.debug;
    }
    
    //
    // return state of a run
    if(params.run && params.thread) {
      isrunning = await this.assistantIsRunning(params);
    }    
    //
    // create a new query
    if(params.user) {
      if(isrunning) {
        throw new Error("A job is already running");
      }

      //
      // create initial thread
      if(!params.thread){
        const thread = await this.openai.beta.threads.create();
        params.thread = thread.id;
      }


      //
      // prepare the new job
      await this.openai.beta.threads.messages.create(params.thread,{
        role: "user",
        content: params.user
      });

      const options:any = {
        assistant_id: params.assistant,
      }
      //
      // custom instruction for this assistant instance
      // https://platform.openai.com/docs/api-reference/runs/createRun
      if(params.instruction) {
        options.additional_instructions = params.instruction
      }
      if(params.model) {
        options.model = params.model;
      }
      if(params.temperature) {
        options.temperature = params.temperature;
      }
      run = await this.openai.beta.threads.runs.create(params.thread,options);


      return {
        run:run.id,
        thread:run.thread_id,
        assistant:run.assistant_id,
        status:run.status,
        extand:run
      };
    }
    return run || {};
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

  reload(){
    // do nothing for now
  }

}

//
// private stuffs
const openaiChunkedIterator = async(stream, cbstream) => {
  let assistant:any = {
    role:"assistant",
    content:""
  };
  let toolsCompletion;
  //
  // normal behavior
  if(stream.choices&&stream.choices[0]?.message) {
    assistant = {...stream.choices[0].message,usage:stream.usage};
    return assistant;
  }

  //
  // streamed content
  for await (const chunk of stream) {
    if(chunk.choices[0]?.delta?.tool_calls) {
      toolsCompletion = true;
    }
    if(chunk.choices[0]?.delta.content) {
      const delta = chunk.choices[0].delta?.content||'';
      assistant.content += delta; 
      // only send the new stream content
      cbstream(delta,{});  
    }
    // Not used
    if(chunk.choices[0]?.finish_reason == 'tool_calls'){
    }
  }
  const content = await stream.finalChatCompletion();
  assistant.usage = content.usage;
  if(toolsCompletion) {
    assistant.tool_calls = content.choices[0]?.message.tool_calls;
  }


  return assistant;
}

