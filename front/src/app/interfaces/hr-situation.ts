import { HRCategoryInterface } from "./hr-category";
import { HRFonctionInterface } from "./hr-fonction";

export interface HRSituationInterface {
	id: number;
	etp: number;
	category: HRCategoryInterface;
	fonction: HRFonctionInterface;
	dateStart: Date;
}
