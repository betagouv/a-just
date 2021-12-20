import { JuridictionInterface } from "./juridiction";

export interface UserInterface {
	id?: number;
	email?: string;
	role?: number;
	roleName?: string;
	status?: number;
	firstName?: string;
	lastName?: string;
	token?: string;
	access?: number[];
	accessName?: string;
	juridictions?: JuridictionInterface[];
}
