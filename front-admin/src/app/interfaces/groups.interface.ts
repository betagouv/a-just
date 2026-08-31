import { BackupInterface } from './backups.interface';

export interface GroupsResponse {
  data: {
    groups: Group[];
    hrbackupAlone: BackupInterface[];
  };
}

export interface Group {
  id: number;
  label: string;
  backups: BackupInterface[];
}
