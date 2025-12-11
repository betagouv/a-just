# Comparateur d'Extracteurs

Outil CLI pour comparer deux fichiers Excel (exports extracteur) avec détection détaillée des différences.

## Utilisation

```bash
# Depuis la racine du projet
npm run comparateur-extracteurs fichier-reference.xlsx fichier-candidat.xlsx
```

## Fonctionnalités

Compare tous les aspects des fichiers Excel :
- ✅ Valeurs des cellules (avec tolérance numérique de 1e-6)
- ✅ Formules
- ✅ Formats de nombres
- ✅ Types de cellules
- ✅ Styles (police, couleur, gras, italique, souligné, remplissage)
- ✅ Validation de données (menus déroulants)

## Codes de sortie

- `0` : Fichiers identiques
- `1` : Fichiers différents (différences affichées sur stdout)
- `2` : Erreur (fichier introuvable, Excel invalide, etc.)

## Exemple de sortie

```
Trouvé 3 différence(s) dans 1 feuille(s) :

Feuille : "Onglet 1" (3 différence(s))
============================================================
  Cellule B5 :
    Valeur : "123" → "124"

  Cellule C10 :
    Police : taille 10→9, gras ajouté

  Cellule D15 :
    Menu déroulant : Option1,Option2 → Option1,Option2,Option3

```

## Utilisation dans les tests E2E

Le module de comparaison est également utilisé par les tests Cypress pour la non-régression des extracteurs.

## Dépendances

Utilise `xlsx` (déjà présent dans le workspace) - aucune nouvelle dépendance.
