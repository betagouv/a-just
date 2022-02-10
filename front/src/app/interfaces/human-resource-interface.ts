import { HRCategoryInterface } from "./hr-category";
import { HRFonctionInterface } from "./hr-fonction";
import { HRSituationInterface } from "./hr-situation";
import { JuridictionInterface } from "./juridiction";
import { RHActivityInterface } from "./rh-activity";

export interface HumanResourceInterface {
	id: number;
	firstName?: string;
	lastName?: string;
	coverUrl?: string;
	workTime?: number;
	juridiction?: JuridictionInterface;
	activities?: RHActivityInterface[];
	dateStart?: Date;
	dateEnd?: Date;
	note?: string;
	totalAffected?: number;
	comment?: string;
	situations: HRSituationInterface[];
}
