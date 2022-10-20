import { ContentieuReferentielInterface } from './contentieu-referentiel';
import { JuridictionInterface } from './juridiction';

export interface ContentieuxOptionsInterface {
  id?: number;
  averageProcessingTime: number | null;
  averageProcessingTimeFonc?: number | null;
  contentieux: ContentieuReferentielInterface;
  juridiction?: JuridictionInterface;
}
