import { PipeTransform, Pipe, Injectable } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';

/**
 * Force to parse une resource url
 */

@Injectable()
@Pipe({
  name: 'sanitizeResourceUrl',
  pure: false, // required to update the value when the promise is resolved
})
export class SanitizeResourceUrlPipe implements PipeTransform {
  /**
   * Construteur
   * @param _sanitizer 
   */
  constructor(private _sanitizer: DomSanitizer) { }

  /**
   * Analyse la chaine
   * @param v 
   * @returns 
   */
  transform(v: string): SafeStyle {
    return this._sanitizer.bypassSecurityTrustResourceUrl(v);
  }
}
