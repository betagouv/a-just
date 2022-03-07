import { ContentieuReferentielInterface } from "./contentieu-referentiel";

export interface ContentieuxOptionsInterface {
	id?: number;
	averageProcessingTime: number | null;
  contentieux: ContentieuReferentielInterface;
}
