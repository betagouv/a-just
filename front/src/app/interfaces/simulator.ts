import { etpAffectedInterface } from './calculator'

export interface SimulatorInterface {
  totalIn: number | null
  totalOut: number | null
  lastStock: number | null
  etpMag: number | null
  etpFon: number | null
  etpCont: number | null
  realCoverage: number | null
  realDTESInMonths: number | null
  magRealTimePerCase: number | null
  magCalculateCoverage: number | null
  fonCalculateCoverage: number | null
  magCalculateDTESInMonths: number | null
	fonCalculateDTESInMonths: number | null;
  magCalculateTimePerCase: number | null
  nbMonth: number
  etpAffected: etpAffectedInterface[] | null
  etpToCompute?: number | null
  monthlyReport?: any[] | null
}
