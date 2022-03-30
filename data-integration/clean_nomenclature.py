import logging

import pandas as pd

from utils import extract_nac

# lire la nomenclature exportée de Mindmap en .csv (mode "Tableau Croisé Dynamique")
klatur = pd.read_csv("config/nomenclature.csv", sep=";")
klatur.dropna(axis=1, how="all", inplace=True)
klatur.fillna(axis=1, method="ffill", inplace=True)

# tous les NAC se retrouvent dans la dernière colonne
NAC_column = klatur.columns[-1]
klatur.rename(columns={"Niveau 7": "NAC"}, inplace=True)

# on supprime les niveaux en dessous de 4
klatur = klatur[
    ["Niveau 1", "Niveau 2", "Niveau 3", "Niveau 4", "NAC"]
].drop_duplicates()

# extraire les NACs
klatur.NAC = klatur.NAC.apply(extract_nac)

# On supprime les feuilles de l'arbre qui ne sont pas des NACs
klatur.dropna(subset=["NAC"], inplace=True)

# on supprime le NAC "00A" qui est "Autre"
klatur = klatur[klatur.NAC != "00A"]

# vérifier qu'il n'y a pas de doublons
if len(klatur["NAC"].unique()) != len(klatur):
    logging.warning("Il semble y avoir des doublons dans la nomenclature.")
    print(
        klatur.groupby("NAC")
        .agg({"Niveau 4": "count"})
        .sort_values("Niveau 4", ascending=False)
        .rename(columns={"Niveau 4": "compte"})
    )

klatur.to_csv("config/nomenclature_clean.csv")
