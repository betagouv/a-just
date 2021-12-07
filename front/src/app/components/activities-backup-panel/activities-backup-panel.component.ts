import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BackupInterface } from 'src/app/interfaces/backup';
import { MainClass } from 'src/app/libs/main-class';
import { ActivitiesService } from 'src/app/services/activities/activities.service';

@Component({
  selector: 'aj-activities-backup-panel',
  templateUrl: './activities-backup-panel.component.html',
  styleUrls: ['./activities-backup-panel.component.scss'],
})
export class ActivitiesBackupPanelComponent extends MainClass implements OnInit, OnDestroy {
  @Input() readOnly: boolean = false;
  backups: BackupInterface[] = [];
  backupId: number | null = null;
  optionsIsModify: boolean = false;

  constructor(private activitiesService: ActivitiesService) {
    super();

    this.watch(
      this.activitiesService.backups.subscribe((b) => (this.backups = b))
    );
    this.watch(
      this.activitiesService.backupId.subscribe((b) => (this.backupId = b))
    );
    this.watch(
      this.activitiesService.optionsIsModify.subscribe(
        (b) => (this.optionsIsModify = b)
      )
    );
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.watcherDestroy();
  }

  onChangeBackup(id: any) {
    if(this.activitiesService.optionsIsModify.getValue() && !confirm('Vous avez des modifications en cours. Supprimer ?')) {
      this.backupId = this.activitiesService.backupId.getValue();
      return;
    }
    this.activitiesService.backupId.next(id);
  }

  onRemoveBackup() {
    this.activitiesService.removeBackup();
  }

  onDuplicateBackup() {
    this.activitiesService.duplicateBackup();
  }

  onSave(isCopy: boolean = false) {
    this.activitiesService.onSaveDatas(isCopy);
  }

  onCreateEmptyBackup() {
    this.activitiesService.createEmpy();
  }
}
