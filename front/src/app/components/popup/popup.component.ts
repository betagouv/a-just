import {
    Component,
    OnInit,
    OnDestroy,
    Input,
    Output,
    EventEmitter,
    HostBinding,
} from '@angular/core'

export interface ActionsInterface {
    type?: string
    red?: boolean
    fill?: boolean
    content: string
    id: string
}

@Component({
    selector: 'aj-popup',
    templateUrl: './popup.component.html',
    styleUrls: ['./popup.component.scss'],
})
export class PopupComponent implements OnInit, OnDestroy {
    @HostBinding('class.is-mobile') isMobile = false
    @Input()
    set visible(d) {
        this._visible = d
    }
    get visible() {
        return this._visible
    }
    @Input() title: string = ''
    @Input() actions: ActionsInterface[] = []
    @Input() actionsLeft: ActionsInterface[] = []
    @Input() closeIcon = false
    @Input() minHeight: string = ''
    @Input() removeShadow: string = ''
    @Output() selectedAction = new EventEmitter()
    @Output() onClose = new EventEmitter()

    _visible = true
    selectedOptions = 0

    constructor() {}

    ngOnInit() {
        console.log('1')
        const element = document.getElementById(
            'hubspot-messages-iframe-container'
        )
        console.log('2')

        if (element) {
            element.style.visibility = 'hidden'
        }
        console.log('3')
    }

    ngOnDestroy() {
        const element = document.getElementById(
            'hubspot-messages-iframe-container'
        )
        if (element) {
            element.style.visibility = 'visible'
        }
        console.log('destroy')
    }

    onSelectAction(action: any) {
        this.selectedAction.emit({
            ...action,
            optionValue: this.selectedOptions,
        })
    }

    onChangeOption(val: any) {
        this.selectedOptions = val
    }

    getInternetExplorerVersion() {
        console.log('4')

        var rv = -1
        if (navigator.appName == 'Microsoft Internet Explorer') {
            var ua = navigator.userAgent
            var re = new RegExp('MSIE ([0-9]{1,}[\\.0-9]{0,})')
            if (re.exec(ua) != null) rv = parseFloat(RegExp.$1)
        } else if (navigator.appName == 'Netscape') {
            var ua = navigator.userAgent
            var re = new RegExp('Trident/.*rv:([0-9]{1,}[\\.0-9]{0,})')
            if (re.exec(ua) != null) rv = parseFloat(RegExp.$1)
        }
        console.log('5')

        return rv
    }
}
