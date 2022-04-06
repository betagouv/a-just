export interface HRCategoryInterface {
	id: number;
	label: string;
	rank?: number;
}

export interface HRCategorySelectedInterface extends HRCategoryInterface {
  selected: boolean;
  etpt: number;
  nbPersonal: number;
  labelPlural: string;
}
