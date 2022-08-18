import { etpAffectedInterface } from './calculator'

export interface SimulationInterface {
  totalIn: number | null
  totalOut: number | null
  lastStock: number | null
  etpSum: number | null
  etpMag: number | null
  etpFon: number | null
  etpCont: number | null
  realCoverage: number | null
  realDTESInMonths: number | null
  realTimePerCase: number | null
}
