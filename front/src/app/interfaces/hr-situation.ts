import { HRCategoryInterface } from "./hr-category";
import { HRFonctionInterface } from "./hr-fonction";
import { RHActivityInterface } from "./rh-activity";

export interface HRSituationInterface {
	id: number;
	etp: number;
	category: HRCategoryInterface | null;
	fonction: HRFonctionInterface | null;
	dateStart: Date;
	activities: RHActivityInterface[];
}
