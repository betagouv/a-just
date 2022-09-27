import { ContentieuReferentielInterface } from "./contentieu-referentiel";
import { UserInterface } from "./user-interface";

export interface ActivityInterface {
	periode: Date;
	entrees: number;
	originalEntrees?: number;
	sorties: number;
	originalSorties?: number;
	stock: number;
	originalStock?: number;
	contentieux: ContentieuReferentielInterface;
	updatedBy?: NodeActivityUpdatedInterface;
}

export interface NodeActivityUpdatedInterface {
	entrees: {user: UserInterface | null, date: Date};
	sorties: {user: UserInterface | null, date: Date};
	stock: {user: UserInterface | null, date: Date};
}
