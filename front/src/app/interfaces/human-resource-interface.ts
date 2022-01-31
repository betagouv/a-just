import { HRCategoryInterface } from "./hr-category";
import { HRFonctionInterface } from "./hr-fonction";
import { JuridictionInterface } from "./juridiction";
import { RHActivityInterface } from "./rh-activity";

export interface HumanResourceInterface {
	id: number;
	firstName?: string;
	lastName?: string;
	coverUrl?: string;
	etp?: number;
	workTime?: number;
	category: HRCategoryInterface;
	fonction?: HRFonctionInterface;
	juridiction?: JuridictionInterface;
	activities?: RHActivityInterface[];
	dateStart?: Date;
	dateEnd?: Date;
	note?: string;
	totalAffected?: number;
}
