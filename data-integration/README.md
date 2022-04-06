# Scripts d'intégration des données A-JUST

Ce dossier contient les scripts python servant aux opérations liées à la manipulation des données d'activité et RH dans A-JUST.

- `clean_nomenclature.py` permet de transformer le fichier `config/nomenclature.csv` en un fichier `config/nomenclature_clean.csv` directement utilisable par le script d'import des données
- `make_activite.py` permet de générer de la donnée aggrégée via la nomenclature A-JUST. Il prend deux arguments : `python make_activite.py {juridiction} {contentieux} {date du fichier}`

Il faut d'abord placer les fichiers Excel envoyés par la SDSE (`C2135_{JURIDICTION}_{date du fichier}.xlsx`) dans le dossier `SDSE`. Les fichiers csv de sortie sont dans `output`.

## Installation 

Les scripts ont été développés en `python` version 3.9.
Pour installer les dépendances, `pip install -r requirements.txt` (utilisez un environnement virtuel)