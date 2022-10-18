export interface ContentieuReferentielInterface {
  id: number
  label: string
  childrens?: ContentieuReferentielInterface[]
  totalAffected?: number
  percent?: number
  selected?: boolean
  rank?: number
  in?: number | null
  originalIn?: number | null
  out?: number | null
  originalOut?: number | null
  stock?: number | null
  originalStock?: number | null
  showActivityGroup?: boolean
  showOptionGroup?: boolean
  averageProcessingTime: number | null
  averageProcessingTimeFonc: number | null
  parent?: ContentieuReferentielInterface
  childIsVisible?: boolean
  isModified?: boolean
  defaultValue?: any
  defaultValueFonc?: any
}
