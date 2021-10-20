import { ActivityInterface } from "./activity";
import { HRCategoryInterface } from "./hr-category";
import { HRFonctionInterface } from "./hr-fonction";
import { JuridictionInterface } from "./juridiction";

export interface HumanResourceInterface {
	id?: number;
	firstName?: string;
	lastName?: string;
	coverUrl?: string;
	etp?: number;
	enable?: boolean;
	category?: HRCategoryInterface;
	fonction?: HRFonctionInterface;
	juridiction?: JuridictionInterface;
	activities?: ActivityInterface[];
}
