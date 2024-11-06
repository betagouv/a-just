import { PipeTransform, Pipe } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';

/**
 * Force to parse une resource url
 */
@Pipe({
  standalone: true,
  name: 'sanitizeResourceUrl',
})
export class SanitizeResourceUrlPipe implements PipeTransform {
  /**
   * Construteur
   * @param _sanitizer
   */
  constructor(private _sanitizer: DomSanitizer) {}

  /**
   * Analyse la chaine
   * @param v
   * @returns
   */
  transform(v: string): SafeStyle {
    return this._sanitizer.bypassSecurityTrustResourceUrl(v);
  }
}
