import { PipeTransform, Pipe, inject } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';

/**
 * Force to parse un url
 */
@Pipe({
  standalone: true,
  name: 'sanitizeUrl',
})
export class SanitizeUrlPipe implements PipeTransform {
  _sanitizer = inject(DomSanitizer);

  /**
   * Analyse la chaine
   * @param v
   * @returns
   */
  transform(v: string): SafeStyle {
    return this._sanitizer.bypassSecurityTrustUrl(v);
  }
}
