export interface BackupInterface {
  id: number;
  label: string;
  date: Date;
  groups?: BackupGroupInterface[];
}

export interface BackupGroupInterface {
  id: number;
  label: string;
}
