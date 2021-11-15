export interface ContentieuReferentielInterface {
	id: number;
	label: string;
	childrens?: ContentieuReferentielInterface[];
	totalAffected?: number;
	percent?: number;
	selected?: boolean;
}
