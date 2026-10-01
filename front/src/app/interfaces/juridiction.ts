export interface JuridictionInterface {
	id: number;
	label: string;	
	iElst?: string;
	latitude?: number;
	longitude?: number;
	population?: number;
	enabled?: boolean;
	group?: {
		id: number;
		label: string;
	} | null;
}
