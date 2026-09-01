import { BackupInterface } from './backups.interface';

export interface UserInterface {
  id?: number;
  email?: string;
  role?: number;
  roleName?: string;
  status?: number;
  firstName?: string;
  lastName?: string;
  tj?: string;
  fonction?: string;
  token?: string;
  access?: number[];
  localAdminIds?: number[];
  accessName?: string;
  accessLabels?: string[];
  ventilations?: BackupInterface[];
  ventilationsName?: string;
  ventilationItems?: { id: number; label: string; isLocalAdmin: boolean }[];
  referentielIds?: number[];
  referentielName?: string;
  referentielLabels?: string[];
}
