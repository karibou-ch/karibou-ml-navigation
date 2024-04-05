module.exports = {
  model:'',
  system:`
Answer the user's question using only the provided information.
Include the page number of the information that you are using.
If the user's question cannot be answered using the provided information, 
respond with "I don't know".`,
  rules:``,
  UX:``,
  tools:{
    system:`
    `,
    functions: {
      params:{response_format:{ type: "json_object" }},
      choice:0,
      context:[],
      exec: async (fn,args)=>  { },
    },
  }
}