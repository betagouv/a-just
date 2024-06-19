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
   * Focus asked from outside
   */
  @Input() askToModify: boolean = false
  /**
 * Emit focus on
 */
  @Input() hideToolbar = false
  /** 
   * Reset signal 
  */
  @Input() resetEditor = false
  /**
  * Valeur de réinitialisation
  */
  @Input() previousValue: string | null = null
  /**
   * Emit value
   */
  @Output() resetField = new EventEmitter()
  /**
   * Changement de valeur
   */
  @Output() valueChange = new EventEmitter()
  /**
   * Emit focus on
   */
  @Output() focusField = new EventEmitter()
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
    if (this.quillEditor) {
      if (change['askToModify']) {
        if (this.askToModify) {
          this.quillEditor.focus()
          setTimeout(() => {
            if (this.quillEditor.getSelection())
              this.quillEditor.setSelection(this.quillEditor.getSelection().index + 10, 0)
          }, 0)
          this.askToModify = false
          this.onFocus()
          this.focusField.emit(false)
        }
      }
      if (change['previousValue'] && this.previousValue !== null) {
        this.quillEditor.root.innerHTML = this.previousValue
        this.quillEditor.blur()
        this.resetField.emit(false)
      }
      if (change['resetEditor']) {
        this.quillEditor.setText('')
        this.resetEditor = false
        this.resetField.emit(false)
      }
      if (change['value']) {
        this.ignoreUpdate = true
        this.quillEditor.root.innerHTML = this.value
      }
    }
  }

  /**
   * Init Quill text editor
   */
  initQuillEditor() {
    const dom = this.contener?.nativeElement
    this.quillEditor = new Quill(dom, {
      modules: {
        toolbar: ['bold', 'italic', 'underline', 'strike', 'link'],
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
      if (range) {
        if (range.length == 0) {
          this.focusField.next(true)
          this.onFocus();
        }
      } else {
        this.focusField.next(false)
        this.onBlur()
      }
    });

    if (this.hideToolbar === true) {
      document.documentElement.style.cssText = "--display-toolbar: hidden"
      this.quillEditor.theme.modules.toolbar.container.style.visibility = "hidden"
    }
  }

  /**
   * Event onfocus raised
   */
  override onFocus() {
    if (this.quillEditor) {
      this.quillEditor.theme.modules.toolbar.container.style.visibility = "visible";
    }
  }

  /**
   * Event blur raised
   */
  onBlur() {
    if (this.quillEditor) {
      this.quillEditor.theme.modules.toolbar.container.style.visibility = "hidden";
    }
  }

}
