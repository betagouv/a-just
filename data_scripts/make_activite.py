import re

import pandas as pd

JURIDICTION = "LYON"
FICHIER = f"SDSE/C2135_D2_{JURIDICTION}.xlsx"
CONTENTIEUX = "JLD"
ALL_SHEETS = [f"{CONTENTIEUX} ({i})" for i in ["Stock", "AN", "AT"]]

REGEX_NAC = re.compile(r"(\d\d[A-Z])")  # un NAC contient 2 chiffres et une lettre

MAPPING_SHEET_NIVEAU_3 = {
    "JAF": "Contentieux JAF",
    "CNS": "Civil Non Spécialisé",
    "JLD": "JLD civil",
    "PS": "Contentieux Social",
}


def run():
    activite = get_sdse()
    mapping = get_nomenclature()
    activite["Niveau 4"] = activite["NAC"].apply(
        lambda nac: mapping.get(nac, {}).get("Niveau 4", "Autres")
    )
    activite_aggregee = activite.groupby(["Niveau 4", "periode"], as_index=False).agg(
        {"value_stock": sum, "value_entrees": sum, "value_sorties": sum}
    )
    activite_aggregee.to_csv(f"outputs/{JURIDICTION}_activite_{CONTENTIEUX}.csv")


def get_sdse():
    stock = _read_clean_sdse(FICHIER, f"{CONTENTIEUX} (Stock)")
    entrees = _read_clean_sdse(FICHIER, f"{CONTENTIEUX} (AN)")
    sorties = _read_clean_sdse(FICHIER, f"{CONTENTIEUX} (AT)")
    final = (
        stock.join(entrees, rsuffix="_entrees")
        .join(sorties, rsuffix="_sorties")
        .rename(columns={"value": "value_stock"})
        .fillna(0)
        .reset_index()
    )
    print(final.head())
    return final


def _read_clean_sdse(fichier, sheet):
    """
    Charge et nettoie la donnée de la SDSE
    Returns:
        un dataframe d'activité
    """
    activite_sdse = pd.read_excel(fichier, sheet_name=sheet, header=2)
    activite_sdse.columns.name = None
    activite_sdse.rename(columns={"Unnamed: 0": "NAC"}, inplace=True)
    # Melt la donnée sur le champs NAC
    activite_sdse = activite_sdse.melt(id_vars=["NAC"], var_name="periode")
    # Extrait le code NAC du champs (NAC + description)
    activite_sdse.NAC = activite_sdse.NAC.apply(extract_nac)
    activite_sdse.dropna(subset=["NAC"], inplace=True)
    # on suppose que <5 = 1 affaire
    activite_sdse.value = activite_sdse.value.apply(make_ints)
    activite_sdse.set_index(["NAC", "periode"], inplace=True)
    return activite_sdse


def extract_nac(nac: str) -> str:
    if not isinstance(nac, str):
        return None
    match = REGEX_NAC.findall(nac)
    if len(match) == 0:
        return None
    else:
        return match[0]


def make_ints(s: str):
    """
    Transforme les champs textuels de la SDSE en nombres
    On suppose que :
        "nc" = 0
        "<5" = 1
    """
    if s == "nc":
        return 0
    return 1 if s == "<5" else int(s)


def get_nomenclature():
    nomenclature = pd.read_csv("nomenclature/nomenclature_clean.csv")
    # Filtre la nomenclature en fonction de la catégorisation SDSE
    # (ce qui évite les erreurs si me même NAC pointe vers plusieurs catégories de Niveau 4)
    nomenclature = nomenclature[
        nomenclature["Niveau 3"] == MAPPING_SHEET_NIVEAU_3[CONTENTIEUX]
    ]
    # Extract nomenclature in a {NAC} -> {Category de Contentieux} format
    mapping = nomenclature.set_index("NAC").to_dict(orient="index")
    return mapping


if __name__ == "__main__":
    run()
