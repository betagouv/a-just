/**
 * Interface pour
 */
export interface DateSelectorinterface {
  title: string
  dateType: string
  value: Date | string | undefined | null
  minDate?: Date
  maxDate?: Date
  showArrow: boolean
}
