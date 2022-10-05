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
	magCalculateTimePerCase: number | null;
	magCalculateOut: number | null;
	magCalculateCoverage: number | null;
	magCalculateDTESInMonths: number | null;
	etpFon: number | null;
	fonRealTimePerCase: number | null;
	fonCalculateTimePerCase: number | null;
	fonCalculateOut: number | null;
	fonCalculateCoverage: number | null;
	fonCalculateDTESInMonths: number | null;
	etpCont: number | null;
	realCoverage: number | null;
	realDTESInMonths: number | null;
	contentieux: ContentieuReferentielInterface;
	nbMonth: number;
	childrens: CalculatorInterface[];
	etpAffected: etpAffectedInterface[];
	needToCalculate: boolean;
	childIsVisible: boolean;
}
