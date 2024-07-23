import { ContentieuReferentielInterface } from "./contentieu-referentiel";

export interface ActivityInterface {
	periode: Date;
	entrees: number;
	sorties: number;
	stock: number;
	contentieux: ContentieuReferentielInterface;
}

export interface ActivityIssueInterface {
	contentieux_label: string,
	hr_backup_label: string,
	last: number,
	new: number,
	type: string,
}
