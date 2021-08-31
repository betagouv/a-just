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
    capacite_de_traitement: float = field(init=False)

    def __post_init__(self):
        self.capacite_de_traitement = (
            self.num_etp / self.contentieux.temps_traitement_moyen
        )

    def __len__(self):
        return self.num_affaires_en_cours

    def _entrees(self, num_entrees: float):
        """
        Ajoute `num_entrees` nouvelles affaires au stock.
        """
        self.num_affaires_en_cours += num_entrees
        return self

    def _sorties(self, num_sorties: float):
        """
        Retire `num_sorties` affaires du stock.
        """
        self.num_affaires_en_cours -= num_sorties
        return self

    def _periode_suivante(self):
        """
        Incrémente l'attribut `periode` d'une unité
        """
        self.periode += 1
        return self

    def delai_attente(self):
        """
        Calcule le délai d'attente pour le stock d'affaires en cours.
        """
        return len(self) / self.capacite_de_traitement

    def __str__(self) -> str:
        return f"Stock {self.contentieux.nom} (t = {self.periode}) : {len(self)} affaires en cours"

    def __repr__(self) -> str:
        return str(self)
