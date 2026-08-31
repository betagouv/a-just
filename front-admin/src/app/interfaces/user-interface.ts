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
  ventilations?: BackupInterface[];
  ventilationsName?: string;
  referentielIds?: number[];
  referentielName?: string;
}
