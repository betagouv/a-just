import pandas as pd

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

klatur.to_csv("config/nomenclature_clean.csv")
