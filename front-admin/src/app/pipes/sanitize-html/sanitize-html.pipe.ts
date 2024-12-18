import { PipeTransform, Pipe, inject } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';

/**
 * Force to parse le html pour le passer dans un dom
 */
@Pipe({
  standalone: true,
  name: 'sanitizeHtml',
})
export class SanitizeHtmlPipe implements PipeTransform {
  _sanitizer = inject(DomSanitizer);

  /**
   * Analyse la chaine
   * @param v
   * @returns
   */
  transform(v: string): SafeStyle {
    return this._sanitizer.bypassSecurityTrustHtml(v);
  }
}
