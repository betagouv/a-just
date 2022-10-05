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
  calculateCoverage: number | null
  calculateDTESInMonths: number | null
  calculateTimePerCase: number | null
  nbMonth: number
  etpAffected: etpAffectedInterface[] | null
  etpToCompute?: number | null
  monthlyReport?: any[] | null
}
