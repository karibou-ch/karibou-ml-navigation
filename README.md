# Les objectifs de l'index
L'objectif de l'index est de produire des listes d'identifiants de produits (SKU) à moindre coût. Voici les principales listes de produits utiles

* Produire la liste des produits préférés d'un utilisateur (ou anonymous).
* Produire la liste des produits de saison.
* Reconnaitre un produit alimentaire et produire la liste des produits (SKU) similaires


# Modèle vectoriel des produits 
Il serait intéressant de travailler sur la caractérisation du produit selon la base de données [openfoodfacts](https://raw.githubusercontent.com/openfoodfacts/openfoodfacts-nodejs/develop/test/mockdata/categories.json) ([2](https://world.openfoodfacts.org/categories)) à la place de l'identifiant. En effet deux produits de deux commerçants différents peuvent concerner le même aliment. 
Une fois caractérisé, avec une table de correspondance `f(sku)`, nous souhaitons également représenter le corpus des produits dans un espace vectoriel (x,y). Il faudra définir la meilleure option sur la base du produit, de la commande, de l'utilisateur et de la fréquence d'achat. 

* https://en.wikipedia.org/wiki/Vector_space_model
* https://en.wikipedia.org/wiki/Cosine_similarity



# Calcul du score d'un produit 
## Nous souhaitons créer une liste des meilleurs produits selon les critères suivants
1. un produit souvent acheté dans le présent est **très** valorisé
1. un produit acheté en petite quantité mais régulièrement est **très** valorisé
1. un produit souvent acheté dans le passé est valorisé
1. un produit acheté en grande quantité une dans très peu de commandes est valorisé 
1. un produit commandé qui génère une erreur du vendeur (stock ou qualité) est **pénalisé**

> Note: Il faut prendre en compte le contexte lors de la génération d'une liste. Il faut pouvoir filtrer cette liste avec les commercants actifs du ou des marchés sélectionnés. 



## L’algorithme doit prédire une liste de produits en fonction des commandes passées
_La fréquence d'achat du produit est une mesure de l'importance du produit dans l'ensemble des commandes d'un client. Elle vise à donner <u>un poids plus important aux produits les plus fréquents, considérés comme plus discriminants</u>_. 


* Liste des produits **i** de 1 à N
* Liste des commandes **j** de 1 à N
* La liste de commande **O**  pour un utilisateur 
* Le nombre de commandes d'un utilisateur où le produit `p{i}`  apparaît
* La fréquence d'achat d'un produit `p{i}` pour toute les commandes *(exemple, 0 + 3 + 2 + 1 = 6 pour 3 commandes = 6/4)*

```
 score = attenuation x prodFreq/UserOrders * boost
```

* Il faut connaître le min/max et la médiane d'un score dans une catégorie 


## Création d'un index pour l'utilisateur Anonymous
On considère un index qui appartient à un utilisateur neutre nommé Anonymous. Le score des produits de l'utilisateur Anonymous est produit par l'activité des commandes de l'ensemble des utilisateurs. Le score obtenu pour chaque produits, est considéré comme une référence normalisée de l'appréciation du produit.

## Valeur du score initiale
Il existe quelques cas de figures ou il n'est pas possible de calculer un score :
1. lorsque l'utilisateur n'a pas encore passé de commande
2. lorsque l'utilisateur n'est pas identifié
3. lorsque qu'il y a un nouveau produit et qu'il n'a pas pu être commandé

# booster
On peut appliquer un booster (un facteur d'amplification) au score d'un produit pour différente situations. 
* Lorsqu'un produit est apprécié, nous considérons que son score plus élevé. 
* Lorsque l'intérêt d'un produit diminue, son score doit également être atténué.
* Lorsqu'un vendeur créé un nouveau produit, son score est artificiellement élevé  d'un facteur N
* Lorsqu'un produit est en promotion, son score est artificiellement élevé d'un facteur M

## l'intérêt d'un produit s'estompe à une fonction du temps
* un produit de saison acheté récemment ~3 doit être valorisé
* un produit perd de son intéret dans le temps jusqu'à ~ 24 mois => 
* On doit pouvoir représenté la courbe réelle  :fire:
```
 attenuation = 1 / ( timeInMonth + 1)^4 x 0.9 + 0.01 
```
      =1/(Math.pow(timeInMonth+1.0,4)*0.9)+0.01;

![image](https://user-images.githubusercontent.com/1422935/162250655-47499e41-6bab-4140-bdd2-4102643e4609.png)


# Penalties
La valeur subjective d'un produit est corrélée avec celle de son score. Cependant il est possible que soudainement un produit apprecié génère de l'insatisfaction (par exemple en fin de saison le produit perd un peu de sa qualité). Dans ce cas, nous proposons d'introduire une pénalité relative au nombre d'insatisfaction qui atténu la valeur du score. Cette atténuation s'estompe également avec le temps. Exemple de problème qui atténu la valeur d'un score:
* plusieurs clients on manifestés un problème avec un même produit (ex. avocat pas assez mûr)
* des clients n'ont pas ressus des produits commandés (mauvaise gestion des stocks)

# Refs
* https://fr.wikipedia.org/wiki/TF-IDF (très intéressant)
* https://fr.wikipedia.org/wiki/Similarit%C3%A9_cosinus
* LateX https://www.overleaf.com/learn/latex/Integrals,_sums_and_limits
