import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BackupInterface } from 'src/app/interfaces/backup';
import { MainClass } from 'src/app/libs/main-class';

@Component({
  selector: 'aj-activities-backup-panel',
  templateUrl: './activities-backup-panel.component.html',
  styleUrls: ['./activities-backup-panel.component.scss'],
})
export class ActivitiesBackupPanelComponent extends MainClass implements OnInit, OnDestroy {
  @Input() readOnly: boolean = false;
  backups: BackupInterface[] = [];
  backupId: number | null = 1; // todo null
  optionsIsModify: boolean = false;

  constructor(/*private contentieuxOptionsService: ContentieuxOptionsService*/) {
    super();

    /*this.watch(
      this.contentieuxOptionsService.backups.subscribe((b) => (this.backups = b))
    );
    this.watch(
      this.contentieuxOptionsService.backupId.subscribe((b) => (this.backupId = b))
    );
    this.watch(
      this.contentieuxOptionsService.optionsIsModify.subscribe(
        (b) => (this.optionsIsModify = b)
      )
    );*/
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.watcherDestroy();
  }

  onChangeBackup(id: any) {
    /*if(this.contentieuxOptionsService.optionsIsModify.getValue() && !confirm('Vous avez des modifications en cours. Supprimer ?')) {
      this.backupId = this.contentieuxOptionsService.backupId.getValue();
      return;
    }
    this.contentieuxOptionsService.backupId.next(id);*/
  }

  onRemoveBackup() {
    //this.contentieuxOptionsService.removeBackup();
  }

  onDuplicateBackup() {
    //this.contentieuxOptionsService.duplicateBackup();
  }

  onSaveHR(isCopy: boolean = false) {
    //this.contentieuxOptionsService.onSaveDatas(isCopy);
  }

  onCreateEmptyBackup() {
    //this.contentieuxOptionsService.createEmpy();
  }
}
