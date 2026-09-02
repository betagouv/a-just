import { BackupInterface } from './backups.interface';

export interface GroupsResponseInterface {
  data: {
    groups: GroupInterface[];
    hrbackupAlone: BackupInterface[];
  };
}

export interface GroupInterface {
  id: number;
  label: string;
  backups: BackupInterface[];
}
