import { AfterViewInit, Component, ElementRef, Input } from '@angular/core'

@Component({
    selector: 'aj-tooltips',
    templateUrl: './tooltips.component.html',
    styleUrls: ['./tooltips.component.scss'],
})
export class TooltipsComponent implements AfterViewInit {
    @Input() title: string = ''
    @Input() content: string = ''
    @Input() footer: string = ''
    @Input() tooltipsIsVisible: boolean = false
    timeoutBeforeShow: any = null

    constructor(private elementRef: ElementRef) {}

    ngAfterViewInit() {
        const parent = this.elementRef.nativeElement.parentElement
        if (parent) {
            parent?.style.setProperty('position', 'relative')
            parent?.addEventListener('mouseenter', (e: any) => {
                if (this.timeoutBeforeShow) {
                    clearTimeout(this.timeoutBeforeShow)
                }

                this.timeoutBeforeShow = setTimeout(() => {
                    this.timeoutBeforeShow = null
                    this.tooltipsIsVisible = true
                }, 1500)
            })
            parent?.addEventListener('click', (e: any) => {
                if (this.timeoutBeforeShow) {
                    clearTimeout(this.timeoutBeforeShow)
                    this.timeoutBeforeShow = null
                }
            })
            parent?.addEventListener('mouseleave', (e: any) => {
                if (this.timeoutBeforeShow) {
                    clearTimeout(this.timeoutBeforeShow)
                    this.timeoutBeforeShow = null
                }

                this.tooltipsIsVisible = false
            })
            this.elementRef.nativeElement?.addEventListener(
                'click',
                (e: any) => {
                    e.stopPropagation()
                }
            )
        }
    }
}
