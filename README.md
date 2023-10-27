# Objectif
L'objectif de l'index est de produire des listes d'identifiants de produits (SKU) à moindre coût selon les besoins du clients. Quelques exemples de listes:

* Les produits préférés d'un utilisateur.
* Les produits de saison.
* Les produits similaires.
* Les produits d'une catégorie.
* Les produits d'une thématique.
* Les produits d'un commerçants.
* Les produits d'un marché.
* Les produits associés à une question.


# Motivation
Produire des listes de produits de manière efficace (mémoire utilisée) et rapide (<50ms) est un élément important pour karibou.ch. Nous devons déléguer ce rôle de l'application principale. 

# Specifications

## 0. Création d'un espace vectoriel
Utilisation d'OpenAI pour créer un espace vertoriel à N dimensions (1536) pour chaque produit. Ceci permet de régler les problèmes suivants:
* trouver des similarité entre produits.
* trouver les produits associés à une question au format *Chat*

Pour l'Index des vecteurs, nous avons plusieurs options
* [Mongodb Atlas Vector Search](https://www.mongodb.com/docs/atlas/atlas-search/field-types/knn-vector/#std-label-fts-knn-vector-type-options)
* [github.com/esteininger/vector-search](https://github.com/esteininger/vector-search/tree/master/use-cases/question-and-answering)
* [From KNN to BERT: A Data Science Interviewee’s Guide to Algorithms and Techniques](https://namratesh.medium.com/from-knn-to-bert-a-data-science-interviewees-guide-to-algorithms-and-techniques-da20b445b8fd)

### Models
On peut soit utiliser un modèle standard, soit utiliser un modèle [fine-tuned](https://platform.openai.com/docs/api-reference/models/list), soit utiliser le modèle standard `text-embedding-ada-002` 

```ts
  const { OpenAI } = require("openai");
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  //
  // models: gpt-3.5-turbo, gpt-4
  const embedding = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: "The quick brown fox jumped over the lazy dog",
    encoding_format: "float",
  });

  console.log(embedding.data[0].embedding); // [float,float,...];

```

## 1. Calcul du score d'un produit 
Le score d'un produit est une fonction des achats et du temps.
Nous souhaitons créer une liste des meilleurs produits selon les critères suivants
1. un produit souvent acheté dans le présent est **très** valorisé
1. un produit acheté en petite quantité mais régulièrement est **très** valorisé
2. un nouveau produit ou un produit de saison activé  est **très** valorisé
3. un produit souvent acheté dans le passé est **moyennement** valorisé
4. un produit acheté en grande quantité une sur une commandes est **moyennement** valorisé 

> Note: Il faut prendre en compte le contexte lors de la génération d'une liste. Il faut pouvoir filtrer cette liste avec les commercants actifs du ou des marchés sélectionnés. 

### L’algorithme doit produire une liste de produits en fonction des commandes passées.
_La fréquence d'achat du produit est une mesure de l'importance du produit dans l'ensemble des commandes d'un client. Elle vise à donner <u>un poids plus important aux produits les plus fréquents, considérés comme plus discriminants</u>_. Les éléments retenus: 

* Liste des produits **`p{i}`** de 1 à N
* Liste des commandes **`o{i}`** de 1 à N
* Le nombre de commande **`O{N}`**  pour un utilisateur 
* Le nombre de commandes **`p{i}O{N}`** où le produit **`p{i}`** apparaît
* La fréquence d'achat d'un produit **`fp{i}`** c'est **`p{i}`** pour **`O{N}`** 
* Il faut extraire les scores min/max ainsi que la médiane par catégories 

```
 score = attenuation x prodFreq/UserOrders * boost/penalties
```

1. **Model:** on créé une MATRIX constituée de N lignes (utilisateurs) et M colonne (produits)
1. **Learn:** on modifie notre MATRIX  (produits (M) + utilisateurs (N)) avec la somme des quantités commandées dans l'historique des cmd.
1. **Score:** on calcul un score pour chaque produit avec la formule précédente
1. **Mitigation:** le score est attenué/amplifié en fonction du contexte de la commande 

### Création d'un index pour l'utilisateur Anonymous
On considère un index qui appartient à un utilisateur neutre nommé Anonymous. Le score normalisé des produits de l'utilisateur Anonymous est le score pondéré par l'ensemble des utilisateurs. La liste des produits associée a l'utilisateur anonymous est aussi utilisée pour compléter une proposition pour un utilisateur qui n'a pas passé sufisament de commandes.

### boost
On peut appliquer un boost (un facteur d'amplification) au score d'un produit pour différente situations. 
1. lorsque l'utilisateur n'a pas encore passé de commande
3. lorsque qu'il y a un nouveau produit qui n'a pas été commandé
4. Lorsqu'un produit est en promotion.

> Note: les constantes sont à determiner et à valider

### l'intérêt d'un produit s'estompe en fonction du temps
* un produit de saison acheté récemment ~3 doit être valorisé
* un produit perd de son intéret dans le temps jusqu'à ~ 24 mois => 
* On doit pouvoir représenter la courbe idéale pour effectuer des tests et déterminer les bons paramêtes :fire:
```
 attenuation = 1 / ( timeInMonth + 1)^4 x 0.9 + 0.01 
```
> Note: les constantes sont à determiner et à valider

![image](https://user-images.githubusercontent.com/1422935/162250655-47499e41-6bab-4140-bdd2-4102643e4609.png)

### Normalisation des scores entres les différents marchés
Lorsque l'on créé un nouveau marché composé de nouvelles boutiques et de boutiques d'un autre marché, les scores des produits doivent rester cohérents. 
1. Le facteur de Boost artificiel des nouveaux produits (sans commande) doit se situer dans la moyenne des produits existants. 
2. Il faut connaître le min/max de l'ensemble des produits
3. Il faut connaître le min/max de l'ensemble des vendeurs
4. Il faut connaître le min/max de l'ensemble des marchés

**TODO** ceci reste a faire


### Penalties
La valeur subjective d'un produit est corrélée avec celle de son score. Cependant il est possible que soudainement un produit apprecié génère de l'insatisfaction (par exemple en fin de saison le produit perd un peu de sa qualité). Dans ce cas, nous proposons d'introduire une pénalité relative au nombre d'insatisfaction qui atténu la valeur du score. Cette atténuation s'estompe également avec le temps. Exemple de problème qui atténu la valeur d'un score:
* plusieurs clients on manifestés un problème avec un même produit (ex. avocat pas assez mûr)
* des clients n'ont pas ressus des produits commandés (mauvaise gestion des stocks)

## 2. Caractérisation des produits pour connaître les produits similaires.
Il serait intéressant de travailler sur la caractérisation du produit selon la base de données [openfoodfacts](https://raw.githubusercontent.com/openfoodfacts/openfoodfacts-nodejs/develop/test/mockdata/categories.json) ([2](https://world.openfoodfacts.org/categories)) à la place de l'identifiant. En effet deux produits de deux commerçants différents peuvent concerner le même aliment. 
Une fois caractérisé, avec une table de correspondance `f(sku)`, nous souhaitons également représenter le corpus des produits dans un espace vectoriel (x,y). Il faudra définir la meilleure option sur la base du produit, de la commande, de l'utilisateur et de la fréquence d'achat. 

* https://en.wikipedia.org/wiki/Vector_space_model
* https://en.wikipedia.org/wiki/Cosine_similarity
* https://world.openfoodfacts.org/categories
* https://world.openfoodfacts.org/categories.json
* https://ch-fr.openfoodfacts.org/categories.json **(ch-fr)**
* https://ch-fr.openfoodfacts.org/ingredients.json **(ch-fr)**
* https://openfoodfacts.github.io/api-documentation/


# Liens* 
* https://www.npmjs.com/package/stopword
* https://fr.wikipedia.org/wiki/TF-IDF 
* https://www.desmos.com/calculator/3yogioggkp?lang=fr
* LateX https://www.overleaf.com/learn/latex/Integrals,_sums_and_limits
