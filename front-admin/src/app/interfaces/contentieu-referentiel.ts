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
  averageProcessingTimeFonc?: number | null;
  parent?: ContentieuReferentielInterface;
}
