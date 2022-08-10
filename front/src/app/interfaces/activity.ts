import { ContentieuReferentielInterface } from "./contentieu-referentiel";

export interface ActivityInterface {
	periode: Date;
	entrees: number;
	originalEntrees?: number;
	sorties: number;
	originalSorties?: number;
	stock: number;
	originalStock?: number;
	contentieux: ContentieuReferentielInterface;
}
