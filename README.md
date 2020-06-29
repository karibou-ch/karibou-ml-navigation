# Calcul du score d'un produit (Attention, le produit est disponible sur plusieurs HUBs)
## sélection des meilleurs produits
1. un produit souvent acheté dans le présent est **très** valorisé
2. un produit souvent acheté dans le passé est **moins** valorisé
3. un produit acheté en petite quantité mais régulièrement est **très** valorisé
4. un produit acheté en grande quantité une dans très peu de commandes est **moyennement** valorisé 

## proposition de produits en complément
* une habitude d'achat `H` individuelle est déterminée par le nombre de produits proposés pour une catégorie donnée
* on utilise une proposition Anonymous lorsque `H` est plus petite que le seuil Anonymous

## L’algorithme utilisé s'inspire du TF-IDF de la recherche de texte
_La fréquence inverse de document (inverse document frequency) est une mesure de l'importance du terme dans l'ensemble des documents indexés. Dans le schéma TF-IDF, elle vise à donner <u>un poids plus important aux termes les moins fréquents, considérés comme plus discriminants</u>_. Pour cette raison on valorise l'inverse.


<img src="https://render.githubusercontent.com/render/math?math=\mathrm{tfidf_i,j} =   (tf_{i,j}) \cdot \log \frac{|D|}{|\{d_{j}: t_{i} \in d_{j}\}|}" />

* <img src="https://render.githubusercontent.com/render/math?math=|D|"/> : nombre total de documents dans le corpus ;
* <img src="https://render.githubusercontent.com/render/math?math=|\{d_{j} : t_{i} \in d_{j}\}|"/> : nombre de documents où le terme `t_{i}`  apparaît (c'est-à-dire <img src="https://render.githubusercontent.com/render/math?math=n_{i,j} \neq 0" />)

## Soit dans notre cas
On souhaite mesurer l'importance d'un produit dans l'ensemble des commandes de l'utilisateur. On donne un poids plus importants aux produits fréquents dans plus de commandes.

* Liste des produits **i** de 1 à N
* Liste des commandes **j** de 1 à N
* <img src="https://render.githubusercontent.com/render/math?math=|CU|"/> : nombre total de commandes pour un utilisateur ;
* <img src="https://render.githubusercontent.com/render/math?math=|\{CU_{j} : p_{i} \in CU_{j}\}|"/> : nombre de commandes de l'utilisateur où le produit `p_{i}`  apparaît
* `Pf(p_i)`; = La fréquence d'achat d'un produit p_i dans toute les commandes *(exemple, 3x + 2x + 1x = 6x pour 3 commandes = 6/3)* 
* `Pf(p_i)`; =  La fréquence d'achat d'un produit p_i dans la commande  / Nombre total de produits dans la commande *(exemple, 3/5 + 2/10 + 1/10 = 9 /10 )*

> déterminer la meilleure manière de calculter PF

<img src="https://render.githubusercontent.com/render/math?math=PfiCUf_{i,j} = (pf_{i,j}) \cdot \log \frac{|\{cu_{j}: p_{i} \in cu_{j}\}|}{|CU|}"/>


# booster
On peut appliquer un booster devant notre score pour associer le score à une fonction du temps

* un produit acheté les ~3 derniers mois est boosté **(x2 -> x1)**
* ensuite il perd de la valeur dans le temps jusqu'à ~ 24 mois => (x1 -> x 1/2)
```
 booster = 1/ ( timeInMonth + 2)^0.7 x 1 / 0.3 
```
![image](https://user-images.githubusercontent.com/1422935/49075769-c494a880-f237-11e8-881e-ee6e230c54a5.png)
*  **variante:** un produit acheté les ~6 derniers mois est boosté **(x3 -> x1)**
```
 booster = 1/ ( timeInMonth + 2)^0.8 x 1 / 0.18 - 0.2 
```
![image](https://user-images.githubusercontent.com/1422935/49078252-cd887880-f23d-11e8-8701-ec859b41c436.png)

# booster de [HN](http://news.ycombinator.com/) 
```
 booster = 1/ ( timeInHours + 2)^1.8 x penalties
```
![image](https://user-images.githubusercontent.com/1422935/49076285-ed696d80-f238-11e8-9a6d-22ab63ccf969.png)

* avec une légère atténuation est ajouté sur la quantité de votes
```
 booster = booster * (votes - 1 )^.8
```


# Refs
* https://fr.wikipedia.org/wiki/TF-IDF 
* https://fr.wikipedia.org/wiki/Similarit%C3%A9_cosinus
* LateX https://www.overleaf.com/learn/latex/Integrals,_sums_and_limits


``` javascript
Required knowledge: machine learning, deep learning, computer science, nodejs, npm, mongodb
Difficulty level: intermediate
Potential mentors: tbd
```

## Starting
```bash
git clone https://github.com/karibou-ch/karibou-ml-userx.git
cd karibou-ml-userx
npm install
npm install -g mocha
mocha  
```
### 1. mocha `test/concept`
1. example that apply `Clarifai` product image detection
1. compute a score concepts for each product 
1. display similar product based on concept
### 2. mocha `test/customer`
1. example that compute customer order frequency and issue related to the past orders



## About the data
Orders contains all information about anonymized user, items, issue , time, etc. Here a short description:
``` javascript
{
    "oid": 2000002,
    "shipping": {
      "postalCode": "1205",
      "when": "2014-12-12T15:00:00.000Z",
      "bags": 2  /** Number of shipped bags for this order */
    },
    "customer": {
      "id": 2180215629900685,
      "pseudo": "f**i",
      "created": "2014-12-09T23:28:45.138Z"
    },
    "vendors": [{"slug": "les-fromages-de-gaetan"},...],
    "items": [
      {
        "title": "Hommos",
        "sku": 1000013,
        "vendor": "crocorient",
        "image": "",
        "estimatedprice": 5,
        "finalprice": 5,
        "qty": 1,
        "category": "Traiteur",
        "status": "failure",
        "issue": {
          "name": "issue_missing_product",
          "missing_product": 1,
          "quality_collect": 0,
          "quality_feedback": 0
        }
      ...
``` 
* customer likes products (click action) `order.cutomer.likes`
* item status for one order `items.status` must be `"failure" or "fulfilled"`
* the case of an issue is different when status is failure or fulfilled, in order `items.issue.name`:
  * when undefined **== defcon 0** , 
  * `"issue_missing_product"` **== defcon 1**, 
  * `"issue_wrong_product_quality"` et `"items.status===failure"` **== defcon 2**,
  * `"issue_wrong_product_quality"` et `"items.status===fulfilled"` **== defcon 5**,
* `discount` is the amount offer by the seller to the customer (that makes shipping fees lower)

description of the `products.json`
```js
  {
    "attributes": {...    },
    "backend": {},
    "categories": "Boucherie et charcuterie",
    "created": "2014-11-23T20:21:56.839Z",
    "details": {
      "origin": "boeuf suisse, sel, poivre, épices",
      "description": "...",
      "keywords": "Boucherie et charcuterie ",
      "internal": "",
      "biodegradable": false,
      "bioconvertion": false,
      "biodynamics": false,
      "grta": false,
      "bio": false,
      "local": true,
      "natural": true,
      "homemade": true,
      ...
    },
    "faq": [],
    "photo": {
      "url": "//ucarecdn.com/2c04d271-2030-4a43-9f18-30dc3f1fc84a/"
    },
    "pricing": {
      "stock": 8,
      "part": "~100gr",
      "price": 8.6
    },
    "sku": 1000030,
    "title": "Viande séchée de Genève",
    "vendor": "les-fromages-de-gaetan",
    "updated": "2017-07-04T12:22:24.446Z",
    "quantity": {
      "comment": "Convient pour 1-2 personnes",
      "display": true
    },
    "shelflife": {
      "comment": "Se conserve 3 jours au frais",
      "display": false
    },
    "variants": [],
    "slug": "viande-sechee-de-geneve",
    "stats": {
      "orders": 195,
      "issues": 0,
      "issues_names": []
    }
```
