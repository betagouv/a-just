import { CommonModule, DOCUMENT } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  HostBinding,
  Inject,
} from '@angular/core';

interface ActionsInterface {
  type?: string;
  red?: boolean;
  fill?: boolean;
  content: string;
  id: string;
}

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'aj-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.scss'],
})
export class PopupComponent implements OnInit, OnDestroy {
  private static activeScrollLocks = 0;
  private static originalHtmlOverflow = '';
  private static originalBodyOverflow = '';
  private scrollLockAcquired = false;

  constructor(@Inject(DOCUMENT) private document: Document) {}

  @HostBinding('class.is-mobile') isMobile = false;
  @Input()
  set visible(d: boolean) {
    this._visible = d;
    this.syncScrollLock(d);
  }
  get visible() {
    return this._visible;
  }
  @Input() title: string = '';
  @Input() actions: ActionsInterface[] = [];
  @Input() closeIcon = false;
  @Input() minHeight: string = '';
  @Output() selectedAction = new EventEmitter();
  @Output() onClose = new EventEmitter();
  _visible = true;
  selectedOptions = 0;

  ngOnInit() {
    this.syncScrollLock(this.visible);
    const element = document.getElementById(
      'hubspot-messages-iframe-container'
    );
    if (element) {
      element.style.visibility = 'hidden';
    }
  }

  ngOnDestroy() {
    this.syncScrollLock(false);
    const element = document.getElementById(
      'hubspot-messages-iframe-container'
    );
    if (element) {
      element.style.visibility = 'visible';
    }
  }

  private syncScrollLock(visible: boolean): void {
    if (visible === this.scrollLockAcquired) {
      return;
    }

    this.scrollLockAcquired = visible;
    if (visible) {
      if (PopupComponent.activeScrollLocks === 0) {
        PopupComponent.originalHtmlOverflow =
          this.document.documentElement.style.overflow;
        PopupComponent.originalBodyOverflow = this.document.body.style.overflow;
        this.document.documentElement.style.overflow = 'hidden';
        this.document.body.style.overflow = 'hidden';
      }
      PopupComponent.activeScrollLocks += 1;
      return;
    }

    PopupComponent.activeScrollLocks -= 1;
    if (PopupComponent.activeScrollLocks === 0) {
      this.document.documentElement.style.overflow =
        PopupComponent.originalHtmlOverflow;
      this.document.body.style.overflow = PopupComponent.originalBodyOverflow;
    }
  }

  onSelectAction(action: any) {
    this.selectedAction.emit({ ...action, optionValue: this.selectedOptions });
  }

  onChangeOption(val: any) {
    this.selectedOptions = val;
  }

  getInternetExplorerVersion() {
    var rv = -1;
    if (navigator.appName == 'Microsoft Internet Explorer') {
      var ua = navigator.userAgent;
      var re = new RegExp('MSIE ([0-9]{1,}[\\.0-9]{0,})');
      if (re.exec(ua) != null) rv = parseFloat(RegExp.$1);
    } else if (navigator.appName == 'Netscape') {
      var ua = navigator.userAgent;
      var re = new RegExp('Trident/.*rv:([0-9]{1,}[\\.0-9]{0,})');
      if (re.exec(ua) != null) rv = parseFloat(RegExp.$1);
    }
    return rv;
  }
}
