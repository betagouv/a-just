import { BackupInterface } from "./backup";

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
	ventilations?: BackupInterface[];
	ventilationsName?: string;
}
