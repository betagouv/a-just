export interface ChartAnnotationBoxInterface {
  display?: boolean
  xMin?: number | null
  xMax?: number | null
  content?: string | undefined
  projectedMag?: number | null
  simulatedMag?: number | null
  projectedStock?: number | null
  simulatedStock?: number | null
  x?: number | null
  y?: number | null
  pointIndex?: number | null
  projectedDTES?: number | null
  simulatedDTES?: number | null
}
