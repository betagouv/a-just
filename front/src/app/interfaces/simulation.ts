import { etpAffectedInterface } from './calculator'

export interface SimulationInterface {
    totalIn: number | null
    totalOut: number | null
    lastStock: number | null
    etpMag: number | null
    realCoverage: number | null
    realDTESInMonths: number | null
    realTimePerCase: number | null
}
