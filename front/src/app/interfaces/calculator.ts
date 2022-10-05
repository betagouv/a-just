import { ContentieuReferentielInterface } from "./contentieu-referentiel";

export interface etpAffectedInterface {
	name: string;
  totalEtp: number;
  rank: number;
}

export interface CalculatorInterface {
	totalIn: number | null;
	totalOut: number | null;
	lastStock: number | null;
	etpMag: number | null;
	magRealTimePerCase: number | null;
	etpFon: number | null;
	fonRealTimePerCase: number | null;
	etpCont: number | null;
	realCoverage: number | null;
	realDTESInMonths: number | null;
	calculateCoverage: number | null;
	calculateDTESInMonths: number | null;
	calculateTimePerCase: number | null;
	calculateOut: number | null;
	contentieux: ContentieuReferentielInterface;
	nbMonth: number;
	childrens: CalculatorInterface[];
	etpAffected: etpAffectedInterface[];
	needToCalculate: boolean;
	childIsVisible: boolean;
}
