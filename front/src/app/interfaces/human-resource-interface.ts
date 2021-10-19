import { HRPositionInterface } from "./hr-position";
import { HRRoleInterface } from "./hr-role";
import { JuridictionInterface } from "./juridiction";

export interface HumanResourceInterface {
	id?: number;
	firstName?: string;
	lastName?: string;
	coverUrl?: string;
	etp?: number;
	enable?: boolean;
	role?: HRRoleInterface;
	position?: HRPositionInterface;
	juridiction?: JuridictionInterface;
}
