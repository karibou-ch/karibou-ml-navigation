# Calcul du score d'un produit (Attention, le produit est disponible sur plusieurs HUBs)
## sélection des meilleurs produits
1. un produit souvent acheté dans le présent est **très** valorisé
2. un produit souvent acheté dans le passé est **moins** valorisé
3. un produit acheté en petite quantité mais régulièrement est **très** valorisé
4. un produit acheté en grande quantité une dans très peu de commandes est **moyennement** valorisé 


## L’algorithme utilisé s'inspire du TF-IDF dédié à la recherche de termes dans l'ensemble d'un corpus
_La fréquence inverse de document (inverse document frequency) est une mesure de l'importance du terme dans l'ensemble des documents indexés. Dans le schéma TF-IDF, elle vise à donner <u>un poids plus important aux termes les moins fréquents, considérés comme plus discriminants</u>_. Pour cette raison on valorise l'inverse.

* https://fr.wikipedia.org/wiki/TF-IDF
* https://fr.wikipedia.org/wiki/Similarit%C3%A9_cosinus

## Il m'a semblé intérressant de s'inspirer de cette formule pour notre besoin
On souhaite mesurer l'importance d'un produit dans l'ensemble des commandes de l'utilisateur. On donne un poids plus importants aux produits fréquemment acheté.

* Liste des produits **i** de 1 à N
* Liste des commandes **j** de 1 à N
* <img src="https://render.githubusercontent.com/render/math?math=|CU|"/> : nombre total de commandes pour un utilisateur ;
* <img src="https://render.githubusercontent.com/render/math?math=|\{CU_{j} : p_{i} \in CU_{j}\}|"/> : nombre de commandes de l'utilisateur où le produit `p_{i}`  apparaît
* Deux options pour `Pf(p_i)`
  * `Pf(p_i)`; = La fréquence d'achat d'un produit p_i dans toute les commandes *(exemple, 3x + 2x + 1x = 6x pour 3 commandes = 6/3)* 
  * `Pf(p_i)`; =  La fréquence d'achat d'un produit p_i dans la commande  / Nombre total de produits dans la commande *(exemple, 3/5 + 2/10 + 1/10 = 9 /10 )*

> il faudrait déterminer la meilleure manière de calculter PF

<img src="https://render.githubusercontent.com/render/math?math=PfiCUf_{i,j} = (pf_{i,j}) \cdot \log \frac{|\{cu_{j}: p_{i} \in cu_{j}\}|}{|CU|}"/>

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

# Penalties
La valeur subjective d'un produit est corrélée avec celle de son score. Cependant il est possible que soudainement un produit apprecié génère de l'insatisfaction (par exemple en fin de saison le produit perd un peu de sa qualité). Dans ce cas, nous proposons d'introduire une pénalité relative au nombre d'insatisfaction qui atténu la valeur du score. Cette atténuation s'estompe également avec le temps. Exemple de problème qui atténu la valeur d'un score:
* plusieurs clients on manifestés un problème avec un même produit (ex. avocat pas assez mûr)
* des clients n'ont pas ressus des produits commandés (mauvaise gestion des stocks)

# Refs
* https://fr.wikipedia.org/wiki/TF-IDF 
* https://fr.wikipedia.org/wiki/Similarit%C3%A9_cosinus
* LateX https://www.overleaf.com/learn/latex/Integrals,_sums_and_limits
