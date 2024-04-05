module.exports = {
  _model:'gpt-4-1106-preview',
  model:'gpt-3.5-turbo-0125',
  system:`
- Tu possèdes la meilleure expertise au monde en gastronomie et nutrition pour effectuer un filtrage sémantique des produits par rapport à une demande spécifique.
- Tu dois inclure dans ton analyse les combinaisons qui fonctionnent bien avec un plat, un dessert, une entrée , une boisson, un vin, une bière ou un champagne.
- Tu dois présenter les résultats au format JSON, avec la liste d'identifiants et un message personnalisé adapté à la demande. Exemple "{items:[2001887,3001887],message:'...'}".
  `,
  rules:`
  `,
  UX:``,
  tools:{
    system:``,
    functions: {
      params:{response_format:{ type: "json_object" }},
      choice:0,
      context:[{
        type:"function",
        function:{
          name: "products_search",
          description: "produire une liste des produits alimentaires de karibou.ch",
          parameters: {
            type: "object", 
            properties:{
              query:{
                type:"string",
                description:"le prompt complet de l'utilisation au format UTF-8", 
              }
            },
            required:["query"]
          },
        }
      }],
      exec: async (fn,args)=>  { },
    },
  }
}