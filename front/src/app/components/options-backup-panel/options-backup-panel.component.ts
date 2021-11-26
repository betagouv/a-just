import { Component, OnDestroy, OnInit } from '@angular/core';
import { BackupInterface } from 'src/app/interfaces/backup';
import { MainClass } from 'src/app/libs/main-class';
import { ContentieuxOptionsService } from 'src/app/services/contentieux-options/contentieux-options.service';

@Component({
  selector: 'aj-options-backup-panel',
  templateUrl: './options-backup-panel.component.html',
  styleUrls: ['./options-backup-panel.component.scss'],
})
export class OptionsBackupPanelComponent extends MainClass implements OnInit, OnDestroy {
  backups: BackupInterface[] = [];
  backupId: number | null = null;
  optionsIsModify: boolean = false;

  constructor(private contentieuxOptionsService: ContentieuxOptionsService) {
    super();

    this.watch(
      this.contentieuxOptionsService.backups.subscribe((b) => (this.backups = b))
    );
    this.watch(
      this.contentieuxOptionsService.backupId.subscribe((b) => (this.backupId = b))
    );
    this.watch(
      this.contentieuxOptionsService.optionsIsModify.subscribe(
        (b) => (this.optionsIsModify = b)
      )
    );}

  ngOnInit() {}

  ngOnDestroy() {
    this.watcherDestroy();
  }

  onChangeBackup(id: any) {
    if(this.contentieuxOptionsService.optionsIsModify.getValue() && !confirm('Vous avez des modifications en cours. Supprimer ?')) {
      this.backupId = this.contentieuxOptionsService.backupId.getValue();
      return;
    }
    this.contentieuxOptionsService.backupId.next(id);
  }

  onRemoveBackup() {
    this.contentieuxOptionsService.removeBackup();
  }

  onDuplicateBackup() {
    this.contentieuxOptionsService.duplicateBackup();
  }

  onSaveHR(isCopy: boolean = false) {
    this.contentieuxOptionsService.onSaveDatas(isCopy);
  }

  trackBy(index: number, item: any) {
    return item.id;
  }

  onCreateEmptyBackup() {
    this.contentieuxOptionsService.createEmpy();
  }
}
