export interface ContentieuReferentielInterface {
	id: number;
	label: string;
	childrens?: ContentieuReferentielInterface[];
	totalAffected?: number;
	percent?: number;
	selected?: boolean;
	rank?: number;
	in?: number | null;
	out?: number | null;
	stock?: number | null;
	showActivityGroup?: boolean;
	showOptionGroup?: boolean;
	averageProcessingTime: number | null;
	parent?: ContentieuReferentielInterface;
}
