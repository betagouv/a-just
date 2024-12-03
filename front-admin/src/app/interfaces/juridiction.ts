import { UserInterface } from './user-interface';

export interface JuridictionInterface {
  id: number;
  label: string;
  iElst?: string;
  latitude?: number;
  longitude?: number;
  population?: number;
  enabled?: boolean;
  users?: UserInterface[];
  nbAgents?: number;
  categoriesAgents?: CategoriesAgentsInterface[];
}

interface CategoriesAgentsInterface {
  label: string;
  nbAgents: number;
}
