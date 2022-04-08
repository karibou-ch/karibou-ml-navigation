# Objectif
L'objectif de l'index est de produire des listes d'identifiants de produits (SKU) à moindre coût. Voici quelques exemples de listes intéressantes:

* Produire la liste des produits préférés d'un utilisateur.
* Produire la liste des produits de saison.
* Produire la liste des produits similaires.
* Produire la liste des produits en fonction d'un tag.
* Produire la liste des produits de commerçants, de marchés ou/et de catégories.


# Motivation
Produire des listes de produits de manière efficace et rapide est un élément important de karibou.ch. Nous souhaitons isoler completement ce rôle de l'application principale. 

# Specification

## 0. Création d'un espace vectoriel
Analyse des différentes pistes pour créer un produit en vecteur (x1,x2) dans un espace euclidien.


## 1. Calcul du score d'un produit 
Nous souhaitons créer une liste des meilleurs produits selon les critères suivants
1. un produit souvent acheté dans le présent est **très** valorisé
1. un produit acheté en petite quantité mais régulièrement est **très** valorisé
2. un nouveau produit ou un produit de saison activé  est **très** valorisé
3. un produit souvent acheté dans le passé est **moyennement** valorisé
4. un produit acheté en grande quantité une sur une commandes est **moyennement** valorisé 

> Note: Il faut prendre en compte le contexte lors de la génération d'une liste. Il faut pouvoir filtrer cette liste avec les commercants actifs du ou des marchés sélectionnés. 

### L’algorithme doit produire une liste de produits en fonction des commandes passées.
_La fréquence d'achat du produit est une mesure de l'importance du produit dans l'ensemble des commandes d'un client. Elle vise à donner <u>un poids plus important aux produits les plus fréquents, considérés comme plus discriminants</u>_. Les éléments retenus: 

* Liste des produits **i** de 1 à N
* Liste des commandes **j** de 1 à N
* Le nombre de commande **O**  pour un utilisateur 
* Le nombre de commandes **O** d'un utilisateur où le produit `p{i}`  apparaît
* La fréquence d'achat d'un produit `p{i}` pour toute les commandes *(exemple, 0 + 3 + 2 + 1 = 6 pour 3 commandes = 6/4)*
* Il faut extraire les scores min/max ainsi que la médiane pour une catégorie 

```
 score = attenuation x prodFreq/UserOrders * boost
```

### Création d'un index pour l'utilisateur Anonymous
On considère un index qui appartient à un utilisateur neutre nommé Anonymous. Le score des produits de l'utilisateur Anonymous est le score moyen et pondéré de l'ensemble des utilisateurs. Le score obtenu pour chaque produits, est considéré comme une référence normalisée. La liste des produits associé a l'utilisateur anonymous est utilisée pour compléter une proposition pour un utilisateur qui n'a pas encore passé de commande.

### Valeur du score initiale
Il existe quelques cas de figures ou il n'est pas possible de calculer un score :
1. lorsque l'utilisateur n'a pas encore passé de commande
2. lorsque l'utilisateur n'est pas identifié
3. lorsque qu'il y a un nouveau produit et qu'il n'a pas pu être commandé

### booster
On peut appliquer un booster (un facteur d'amplification) au score d'un produit pour différente situations. 
* Lorsqu'un produit est apprécié, nous considérons que son score plus élevé. 
* Lorsque l'intérêt d'un produit diminue, son score doit également être atténué.
* Lorsqu'un vendeur créé un nouveau produit, son score est artificiellement élevé  d'un facteur N
* Lorsqu'un produit est en promotion, son score est artificiellement élevé d'un facteur M

### l'intérêt d'un produit s'estompe en fonction du temps
* un produit de saison acheté récemment ~3 doit être valorisé
* un produit perd de son intéret dans le temps jusqu'à ~ 24 mois => 
* On doit pouvoir représenter la courbe idéale pour effectuer des tests et déterminer les bons paramêtes :fire:
```
 attenuation = 1 / ( timeInMonth + 1)^4 x 0.9 + 0.01 
```

![image](https://user-images.githubusercontent.com/1422935/162250655-47499e41-6bab-4140-bdd2-4102643e4609.png)

### Normalisation des scores entres les différents marchés
Lorsque l'on créé un nouveau marché composé de nouvelles boutiques et de boutiques d'un autre marché, les scores des produits doivent rester cohérents. 
> TODO


### Penalties
La valeur subjective d'un produit est corrélée avec celle de son score. Cependant il est possible que soudainement un produit apprecié génère de l'insatisfaction (par exemple en fin de saison le produit perd un peu de sa qualité). Dans ce cas, nous proposons d'introduire une pénalité relative au nombre d'insatisfaction qui atténu la valeur du score. Cette atténuation s'estompe également avec le temps. Exemple de problème qui atténu la valeur d'un score:
* plusieurs clients on manifestés un problème avec un même produit (ex. avocat pas assez mûr)
* des clients n'ont pas ressus des produits commandés (mauvaise gestion des stocks)

## 2. Caractérisation des produits pour connaître les produits similaires.
Il serait intéressant de travailler sur la caractérisation du produit selon la base de données [openfoodfacts](https://raw.githubusercontent.com/openfoodfacts/openfoodfacts-nodejs/develop/test/mockdata/categories.json) ([2](https://world.openfoodfacts.org/categories)) à la place de l'identifiant. En effet deux produits de deux commerçants différents peuvent concerner le même aliment. 
Une fois caractérisé, avec une table de correspondance `f(sku)`, nous souhaitons également représenter le corpus des produits dans un espace vectoriel (x,y). Il faudra définir la meilleure option sur la base du produit, de la commande, de l'utilisateur et de la fréquence d'achat. 

* https://en.wikipedia.org/wiki/Vector_space_model
* https://en.wikipedia.org/wiki/Cosine_similarity


# Liens
* https://fr.wikipedia.org/wiki/TF-IDF (très intéressant)
* https://www.desmos.com/calculator/3yogioggkp?lang=fr
* LateX https://www.overleaf.com/learn/latex/Integrals,_sums_and_limits
