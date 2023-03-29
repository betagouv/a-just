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
   * Value
   */
  @Input() value: string = ''
  /**
   * Emit value
   */
  @Output() valueChange = new EventEmitter()
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
      theme: 'snow',
    })

    if (this.value) {
      this.quillEditor.setText(this.value, 'api')
    }

    this.quillEditor.on(
      'text-change',
      (delta: any, oldDelta: any, source: string) => {
        if (source == 'api') {
          // console.log('An API call triggered this change.')
        } else if (source == 'user') {
          if (this.ignoreUpdate === false) {
            // console.log('A user action triggered this change.')
            this.value = this.quillEditor.root.innerHTML
            this.valueChange.emit(this.value)
          } else {
            this.ignoreUpdate = false
          }
        }
      }
    )
  }
}
