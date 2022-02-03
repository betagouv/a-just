import { ContentieuReferentielInterface } from "./contentieu-referentiel";

export interface RHActivityInterface {
	id: number;
	codeNac?: string;
	label?: string;
	percent?: number;
	referentielId: number;
	dateStart?: Date;
	dateStop?: Date;
	contentieux?: ContentieuReferentielInterface;
	isDeleted?: boolean;
}
