from dataclasses import dataclass, field


@dataclass
class Contentieux:
    nom: str
    temps_traitement_moyen: float


@dataclass
class Stock:
    contentieux: Contentieux
    num_etp: float
    num_affaires_en_cours: float = 0
    periode: int = 0

    @property
    def capacite_de_traitement(self):
        return self.num_etp / self.contentieux.temps_traitement_moyen

    @property
    def taille(self):
        return self.num_affaires_en_cours

    def entrees(self, num_entrees: float):
        """
        Ajoute `num_entrees` nouvelles affaires au stock.
        """
        self.num_affaires_en_cours += num_entrees
        return self

    def sorties(self, num_sorties: float):
        """
        Retire `num_sorties` affaires du stock.
        """
        self.num_affaires_en_cours -= num_sorties
        return self

    def periode_suivante(self):
        """
        Incrémente l'attribut `periode` d'une unité
        """
        self.periode += 1
        return self

    @property
    def delai_attente(self):
        """
        Calcule le délai d'attente pour le stock d'affaires en cours.
        """
        return self.taille / self.capacite_de_traitement

    def __str__(self) -> str:
        return f"Stock {self.contentieux.nom} (t = {self.periode}) : {self.taille} affaires en cours, {self.num_etp} ETP affectés, délai d'attente : {self.delai_attente}"

    def __repr__(self) -> str:
        return str(self)
