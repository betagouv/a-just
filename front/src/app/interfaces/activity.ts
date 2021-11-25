import { ContentieuReferentielInterface } from "./contentieu-referentiel";

export interface ActivityInterface {
	periode: Date;
	entrees: number;
	sorties: number;
	stock: number;
	contentieux: ContentieuReferentielInterface;
}
