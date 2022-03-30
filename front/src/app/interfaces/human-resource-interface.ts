import { HRSituationInterface } from "./hr-situation";
import { RHActivityInterface } from "./rh-activity";

export interface HumanResourceInterface {
	id: number;
	firstName?: string;
	backupId?: number;
	lastName?: string;
	coverUrl?: string;
	workTime?: number;
	dateStart?: Date;
	dateEnd?: Date;
	note?: string;
	totalAffected?: number;
	comment?: string;
	situations: HRSituationInterface[];
	indisponibilities: RHActivityInterface[];
	updatedAt: Date;
}
