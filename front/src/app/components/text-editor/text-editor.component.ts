import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MainClass } from '../../libs/main-class';


declare const Quill: any;

/**
 * Composent de mise en page en mode connecté
 */

@Component({
  selector: 'aj-text-editor',
  standalone: true,
  imports: [],
  templateUrl: './text-editor.component.html',
  styleUrls: ['./text-editor.component.scss'],
})
export class TextEditorComponent extends MainClass {
  /**
   * DOM qui pointe sur le conteneur
   */
  @ViewChild('editor') contener: ElementRef<HTMLElement> | null = null;
  /**
   * Title
   */
  @Input() title: string | undefined;
  /**
   * Title
   */
  @Input() placeholder: string | undefined;
  /**
   * Value
   */
  @Input() value: string = '';
  /**
   * Focus asked from outside
   */
  @Input() askToModify: boolean = false;
  /**
   * Emit focus on
   */
  @Input() hideToolbar = false;
  /**
   * Reset signal
   */
  @Input() resetEditor = false;
  /**
   * Valeur de réinitialisation
   */
  @Input() previousValue: string | null = null;
  /**
   * Valeure par défaut de l'éditeur
   */
  @Input() defaultReadOnly: boolean = false;
  /**
   * Link to editor
   */
  @Input() acceptLink: boolean = true;
  /**
   * Emit value
   */
  @Output() resetField = new EventEmitter();
  /**
   * Changement de valeur
   */
  @Output() valueChange = new EventEmitter();
  /**
   * Emit focus on
   */
  @Output() focusField = new EventEmitter();
  /**
   * Quill editor
   */
  quillEditor: any = null;
  /**
   * Ignore update
   */
  ignoreUpdate: boolean = false;

  /**
   * Constructeur
   */
  constructor() {
    super();
  }

  ngAfterViewInit() {
    this.initQuillEditor();
  }

  /**
   * Detect on text change top update content
   * @param change
   */
  ngOnChanges(change: SimpleChanges) {
    if (this.quillEditor) {
      if (change['askToModify']) {
        if (this.askToModify) {
          this.quillEditor.enable();
        } else {
          this.quillEditor.disable();
        }

        if (this.askToModify) {
          this.quillEditor.focus();
          setTimeout(() => {
            if (this.quillEditor.getSelection())
              this.quillEditor.setSelection(
                this.quillEditor.getSelection().index + 10,
                0
              );
          }, 0);
          this.onFocus();
        }
      }
      if (change['previousValue'] && this.previousValue !== null) {
        this.quillEditor.root.innerHTML = this.previousValue;
        this.quillEditor.blur();
        this.resetField.emit(false);
      }
      if (change['resetEditor']) {
        this.quillEditor.setText('');
        this.resetEditor = false;
        this.resetField.emit(false);
      }
      if (change['value']) {
        this.ignoreUpdate = true;
        this.quillEditor.root.innerHTML = this.cleanInputValue(this.value);
        if (this.value) {
          this.quillEditor.root.classList.add('hide-place-holder');
        } else {
          this.quillEditor.root.classList.remove('hide-place-holder');
        }
      }
    }
  }

  @HostListener('click', ['$event.target'])
  onClick(btn: any) {
    if (btn && btn.href && !this.askToModify) {
      // do nothing
    } else {
      this.focusField.next(true);
      this.onFocus();
    }
  }

  /**
   * Clean format of Quill render html
   */
  formatHTMLToRendering(html: string) {
    html = html.replace(/a href="(?!http)/, 'a href="https://');
    return html;
  }

  /**
   * Init Quill text editor
   */
  initQuillEditor() {
    const toolbar: any[] = ['bold', 'italic', 'underline', 'strike'];
    if (this.acceptLink) {
      toolbar.push('link');
    }
    toolbar.push({ list: 'bullet' });

    const dom = this.contener?.nativeElement;
    this.quillEditor = new Quill(dom, {
      readOnly: this.defaultReadOnly,
      modules: {
        toolbar,
      },
      placeholder: this.placeholder,
      theme: 'snow',
    });

    if (this.value) {
      //this.quillEditor.setText(this.value, 'api')
      this.quillEditor.root.innerHTML = this.cleanInputValue(this.value);
    }

    this.quillEditor.on(
      'text-change',
      (delta: any, oldDelta: any, source: string) => {
        if (source == 'api') {
          // console.log('An API call triggered this change.')
        } else if (source == 'user') {
          if (this.ignoreUpdate === false) {
            // console.log('A user action triggered this change.')
            this.value = !this.quillEditor.root.innerText.trim()
              ? ''
              : this.quillEditor.root.innerHTML;
            this.value = this.formatHTMLToRendering(this.value);
            this.valueChange.emit(this.value);
          } else {
            this.ignoreUpdate = false;
          }
        }
      }
    );

    this.quillEditor.on(
      'selection-change',
      (range: any, oldRange: any, source: any) => {
        if (range) {
          if (range.length == 0) {
            //this.focusField.next(true);
            //this.onFocus();
          }
        } else {
          this.focusField.next(false);
          this.onBlur();
        }
      }
    );

    if (this.hideToolbar === true) {
      document.documentElement.style.cssText = '--display-toolbar: hidden';
      this.quillEditor.theme.modules.toolbar.container.style.visibility =
        'hidden';
    }
  }

  /**
   * Event onfocus raised
   */
  override onFocus() {
    if (this.quillEditor) {
      this.quillEditor.theme.modules.toolbar.container.style.visibility =
        'visible';
    }
  }

  /**
   * Event blur raised
   */
  onBlur() {
    if (this.quillEditor) {
      this.quillEditor.theme.modules.toolbar.container.style.visibility =
        'hidden';
    }
  }

  /**
   * Force focus
   */
  focus() {
    if (this.quillEditor) {
      this.quillEditor.enable();
      this.quillEditor.focus();
      this.quillEditor.setSelection(this.quillEditor.getLength(), 0);
      this.focusField.next(true);
    }
  }

  /**
   * Force new value
   */
  setValue(text: string) {
    this.value = text;
    this.ignoreUpdate = true;
    this.quillEditor.root.innerHTML = this.cleanInputValue(this.value);
    this.valueChange.emit(this.value);
  }

  /**
   * Force to init new value
   */
  initValue(text: string) {
    this.value = text;
    this.ignoreUpdate = true;
    this.quillEditor.root.innerHTML = '';
    setTimeout(() => {
      this.quillEditor.root.innerHTML = this.cleanInputValue(this.value);
    }, 0);
    this.valueChange.emit(this.value);
  }

  /**
   * Clean input new values
   */
  cleanInputValue(text: string) {
    if (text.includes('<ul>')) {
      text = text.replace(/<ul>/gm, '<ol>');
      text = text.replace(/<\/ul>/gm, '</ol>');
      text = text.replace(/<li>/gm, '<li data-list="bullet">');
    }
    return text;
  }
}
