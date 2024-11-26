export enum ValueQualityEnum {
  ptional = "facultatif",
  good = "good",
  toComplete = "to_complete",
  toVerify = "to_verify",
}

export interface ContentieuReferentielInterface {
  id: number;
  label: string;
  childrens?: ContentieuReferentielInterface[];
  totalAffected?: number;
  percent?: number;
  selected?: boolean;
  rank?: number;
  in?: number;
  out?: number;
  stock?: number;
  showActivityGroup?: boolean;
  showOptionGroup?: boolean;
  averageProcessingTime: number | null;
  parent?: ContentieuReferentielInterface;
  valueQualityIn?: ValueQualityEnum | null;
  valueQualityOut?: ValueQualityEnum | null;
  valueQualityStock?: ValueQualityEnum | null;
  helpUrl?: string | null;
}
