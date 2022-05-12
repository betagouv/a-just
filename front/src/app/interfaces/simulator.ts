import { etpAffectedInterface } from './calculator';

export interface SimulatorInterface {
  totalIn: number | null;
  totalOut: number | null;
  lastStock: number | null;
  etpMag: number | null;
  etpFon: number | null;
  etpCont: number | null;
  realCoverage: number | null;
  realDTESInMonths: number | null;
  realTimePerCase: number | null;
  calculateCoverage: number | null;
  calculateDTESInMonths: number | null;
  calculateTimePerCase: number | null;
  nbMonth: number;
  etpAffected: etpAffectedInterface[] | null;
}
