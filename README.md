# Objectif
L'objectif d'un index est de produire des listes d'identifiants de produits (SKU) à très faible coût (CPU+MEM) qui match les besoins du clients. Quelques exemples de listes:

* Les produits préférés d'un utilisateur.
* Les produits de saison.
* Les produits similaires.
* Les produits d'une catégorie.
* Les produits d'une thématique.
* Les produits d'un commerçants.
* Les produits d'un marché.
* Les produits associés à une phrase.


# Motivation
Produire des listes de produits de manière efficace (faible mémoire utilisée) et rapide (<50ms) est un élément important pour karibou.ch. Nous devons déléguer ce travail de l'application principale (karibou-api). 

# Specifications

## 1. Calcul du score d'un produit 
Le score d'un produit est le résultat d'une fonction des achats dans le temps. Nous devons créer une liste des meilleurs produits selon les critères suivants.
1. un produit souvent acheté dans le présent est **très** valorisé
1. un produit acheté en petite quantité mais régulièrement est **très** valorisé
2. un nouveau produit ou un produit de saison activé  est **très** valorisé
3. un produit souvent acheté dans le passé est **moyennement** valorisé
4. un produit acheté en grande quantité une sur une commandes est **moyennement** valorisé 

> Note: Il faut prendre en compte le contexte lors de la génération d'une liste. Il faut pouvoir contraindre les données avec les commercants actifs d'un marché spécifique. 

### Apprentissage.
_La fréquence d'achat du produit est une mesure de l'importance du produit dans l'ensemble des commandes d'un client. Elle vise à donner <u>un poids plus important aux produits les plus fréquents, considérés comme plus discriminants</u>_. 



* Ensemble des utilisateurs **`{u}`** de 1 à N
  * contient les clients, les groupes de clients et l'utilisateur `Anonymous`
* Ensemble des produits **`{p}`** de 1 à N
* Ensemble des commandes **`{o}`** de 1 à N
* Le nombre de commande **`oFreq`**  pour un utilisateur 
* Le nombre de commandes **`pFreq`** où le produit apparaît
* Il faut extraire les scores min/max/avg par catégories 

```
 score =  log(attenuation * prodFreq) * prodOrders/(UserOrders+1)
```

1. **Model:** on créé une MATRIX constituée de N lignes (utilisateurs) et M colonne (produits)
1. **Learn:** on modifie notre MATRIX  (produits (M) + utilisateurs (N)) avec la somme des quantités commandées dans l'historique des cmd.
1. **Score:** on calcul un score pour chaque produit avec la formule précédente
1. **Mitigation:** le score est attenué/amplifié en fonction du contexte de la commande 

### Création d'un index pour l'utilisateur Anonymous
On considère un index qui appartient à un utilisateur neutre `Anonymous`. Le score normalisé des produits de l'utilisateur `Anonymous` est le score pondéré par l'ensemble des utilisateurs. La liste des produits associée a l'utilisateur anonymous est aussi utilisée pour compléter une proposition pour un utilisateur qui n'a pas passé sufisament de commandes.

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
 attenuation = 1 / ( timeInMonth + 0.9)^1 x 1.8 + 0.1 
```
> Note: les constantes sont à determiner et à valider

![image](https://github.com/karibou-ch/karibou-ml-userx/assets/1422935/8f8ff35e-1ef1-4892-82b3-5cac2597e37e)


### Normalisation des scores entres les différents marchés
Lorsque l'on créé un nouveau marché composé de nouvelles boutiques et de boutiques d'un autre marché, les scores des produits doivent rester cohérents. 
1. On utilise les valeurs min/max/avg de chaque catégories pour déterminer les scores initiaux d'un nouveau marchés .


### Penalties
La valeur subjective d'un produit est corrélée avec celle de son score. Cependant il est possible que soudainement un produit apprecié génère de l'insatisfaction (par exemple en fin de saison le produit perd un peu de sa qualité). Dans ce cas, nous proposons d'introduire une pénalité relative au nombre d'insatisfaction qui atténu la valeur du score. Cette atténuation s'estompe également avec le temps. Exemple de problème qui atténu la valeur d'un score:
* plusieurs clients on manifestés un problème avec un même produit (ex. avocat pas assez mûr)
* des clients n'ont pas ressus des produits commandés (mauvaise gestion des stocks)

## 2. Création d'un espace vectoriel (par utilisateur) pour remplacer le score

L'intégration des techniques d'apprentissage automatique et l'analyse des vecteurs d'embedding peuvent considérablement améliorer la pertinence des recommandations. Et comme depuis peu, la possibilité de créer un espace-vertoriel à N dim (1536) pour chaque produit est ultra-simplifié, nous souhaitons transformer karibou-api en un esemble d'espaces de vecteurs à 1536 dim afin de capturer des nuances plus subtiles dans les préférences des utilisateurs.
* trouver des similarité entre produits.
* trouver les produits associés à un *text*

Pour l'Index des vecteurs, nous avons plusieurs options
* [Mongodb Atlas Vector Search](https://www.mongodb.com/docs/atlas/atlas-search/field-types/knn-vector/#std-label-fts-knn-vector-type-options)
* [github.com/esteininger/vector-search](https://github.com/esteininger/vector-search/tree/master/use-cases/question-and-answering)
* [From KNN to BERT: A Data Science Interviewee’s Guide to Algorithms and Techniques](https://namratesh.medium.com/from-knn-to-bert-a-data-science-interviewees-guide-to-algorithms-and-techniques-da20b445b8fd)

### Models
On peut soit utiliser un modèle standard, soit utiliser un modèle [fine-tuned](https://platform.openai.com/docs/api-reference/models/list), soit utiliser le modèle standard `text-embedding-ada-002` 



* https://api.karibou.ch/v1/products
* https://world.openfoodfacts.org/categories.json
* https://ch-fr.openfoodfacts.org/categories.json **(ch-fr)**
* https://ch-fr.openfoodfacts.org/ingredients.json **(ch-fr)**
* https://openfoodfacts.github.io/api-documentation/
* https://en.wikipedia.org/wiki/Vector_space_model
* https://en.wikipedia.org/wiki/Cosine_similarity


# Liens* 
* [collaborative filtering / recommendation engine](https://www.npmjs.com/search?q=recommendation+engine)
* https://www.npmjs.com/package/stopword
* https://fr.wikipedia.org/wiki/TF-IDF 
* https://www.desmos.com/calculator/3yogioggkp?lang=fr
* LateX https://www.overleaf.com/learn/latex/Integrals,_sums_and_limits
