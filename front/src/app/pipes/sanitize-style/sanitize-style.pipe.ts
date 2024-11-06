import { PipeTransform, Pipe } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';

/**
 * Force to parse le style
 */
@Pipe({
  standalone: true,
  name: 'sanitizeStyle',
})
export class SanitizeStylePipe implements PipeTransform {
  /**
   * Constructeur
   * @param _sanitizer
   */
  constructor(private _sanitizer: DomSanitizer) {}

  /**
   * Analyse la chaine
   * @param v
   * @returns
   */
  transform(v: string): SafeStyle {
    return this._sanitizer.bypassSecurityTrustStyle(v);
  }
}
