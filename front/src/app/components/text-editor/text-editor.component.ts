import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'

declare const Quill: any

/**
 * Composent de mise en page en mode connecté
 */

@Component({
  selector: 'aj-text-editor',
  templateUrl: './text-editor.component.html',
  styleUrls: ['./text-editor.component.scss'],
})
export class TextEditorComponent extends MainClass {
  /**
   * DOM qui pointe sur le conteneur
   */
  @ViewChild('editor') contener: ElementRef<HTMLElement> | null = null
  /**
   * Title
   */
  @Input() title: string | undefined
  /**
   * Title
   */
  @Input() placeholder: string | undefined
  /**
   * Value
   */
  @Input() value: string = ''
  /**
 * Emit focus on
 */
  @Input() hideToolbar = false
  /**
   * Emit value
   */
  @Output() valueChange = new EventEmitter()
  /**
 * Emit focus on
 */
  @Output() focusOn = new EventEmitter()
  /**
* Emit focus out
*/
  @Output() focusOut = new EventEmitter()
  /**
   * Quill editor
   */
  quillEditor: any = null
  /**
   * Ignore update
   */
  ignoreUpdate: boolean = false

  /**
   * Constructeur
   */
  constructor() {
    super()
  }

  ngAfterViewInit() {
    this.initQuillEditor()
  }

  /**
   * Detect on text change top update content
   * @param change
   */
  ngOnChanges(change: SimpleChanges) {
    if (change['value'] && this.quillEditor) {
      this.ignoreUpdate = true
      this.quillEditor.root.innerHTML = this.value
    }
  }

  /**
   * Init Quill text editor
   */
  initQuillEditor() {
    const dom = this.contener?.nativeElement
    this.quillEditor = new Quill(dom, {
      modules: {
        toolbar: ['bold', 'italic', 'underline', 'strike'],
      },
      placeholder: this.placeholder,
      theme: 'snow',
    })

    if (this.value) {
      //this.quillEditor.setText(this.value, 'api')
      this.quillEditor.root.innerHTML = this.value

    }

    this.quillEditor.on(
      'text-change',
      (delta: any, oldDelta: any, source: string) => {
        if (source == 'api') {
          // console.log('An API call triggered this change.')
        } else if (source == 'user') {
          if (this.ignoreUpdate === false) {
            // console.log('A user action triggered this change.')
            this.value = !(this.quillEditor.root.innerText.trim()) ? '' : this.quillEditor.root.innerHTML
            this.valueChange.emit(this.value)
          } else {
            this.ignoreUpdate = false
          }
        }
      }
    )

    this.quillEditor.on('selection-change', (range: any, oldRange: any, source: any) => {
      console.log(source)
      if (range) {
        if (range.length == 0) {
          console.log('User cursor is on', range.index);
          this.onFocus();
          this.focusOn.next(true)
        }
      } else {
        console.log('Cursor not in the editor');
        this.onBlur();
        this.focusOn.next(false)
        console.log(this.quillEditor)
      }
    });

    if (this.hideToolbar === true) {
      document.documentElement.style.cssText = "--display-toolbar: hidden"
      this.quillEditor.theme.modules.toolbar.container.style.visibility = "hidden"
    }
  }

  override onFocus() {
    this.quillEditor.theme.modules.toolbar.container.style.visibility = "visible";
  }

  onBlur() {
    this.quillEditor.theme.modules.toolbar.container.style.visibility = "hidden";
  }

}
