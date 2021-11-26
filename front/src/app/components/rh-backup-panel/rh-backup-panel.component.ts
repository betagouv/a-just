import { Component, OnDestroy, OnInit } from '@angular/core';
import { BackupInterface } from 'src/app/interfaces/backup';
import { MainClass } from 'src/app/libs/main-class';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';

@Component({
  selector: 'aj-rh-backup-panel',
  templateUrl: './rh-backup-panel.component.html',
  styleUrls: ['./rh-backup-panel.component.scss'],
})
export class RhBackupPanelComponent extends MainClass implements OnInit, OnDestroy {
  backups: BackupInterface[] = [];
  backupId: number | null = null;
  hrIsModify: boolean = false;

  constructor(private humanResourceService: HumanResourceService) {
    super();

    this.watch(
      this.humanResourceService.backups.subscribe((b) => (this.backups = b))
    );
    this.watch(
      this.humanResourceService.backupId.subscribe((b) => (this.backupId = b))
    );
    this.watch(
      this.humanResourceService.hrIsModify.subscribe(
        (b) => (this.hrIsModify = b)
      )
    );}

  ngOnInit() {}

  ngOnDestroy() {
    this.watcherDestroy();
  }

  onChangeBackup(id: any) {
    if(this.humanResourceService.hrIsModify.getValue() && !confirm('Vous avez des modifications en cours. Supprimer ?')) {
      this.backupId = this.humanResourceService.backupId.getValue();
      return;
    }
    this.humanResourceService.backupId.next(id);
  }

  onRemoveBackup() {
    this.humanResourceService.removeBackup();
  }

  onDuplicateBackup() {
    this.humanResourceService.duplicateBackup();
  }

  onSaveHR(isCopy: boolean = false) {
    this.humanResourceService.onSaveHRDatas(isCopy);
  }

  trackBy(index: number, item: any) {
    return item.id;
  }

  onCreateEmptyBackup() {
    this.humanResourceService.createEmpyHR();
  }
}
