import { Component, ElementRef, Input, ViewChild } from '@angular/core'
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
   * Quill editor
   */
  quillEditor: any = null
  /**
   * Value
   */
  value: string = ''

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

    this.quillEditor.on('text-change', (delta: any, oldDelta: any, source: string) => {
      if (source == 'api') {
        // console.log('An API call triggered this change.')
      } else if (source == 'user') {
        // console.log('A user action triggered this change.')
        this.value = this.quillEditor.root.innerHTML
      }
    })
  }
}
